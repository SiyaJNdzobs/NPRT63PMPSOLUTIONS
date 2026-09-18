import io
import re
import uuid
import base64
import logging
import math
from datetime import datetime
from typing import Optional, List

import qrcode
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from core import (db, hash_secret, verify_secret, normalize_phone, fare_to_int,
                  fare_label, is_long_distance, create_token, now_iso,
                  get_current_user, require_role, APP_BASE_URL)
import seed as seed_module
from emailer import send_email

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("erank")

app = FastAPI()
api = APIRouter(prefix="/api")

PROJ = {'_id': 0}
USER_PUB = {'_id': 0, 'secret_hash': 0}


# ---------------- helpers ----------------
def _need(value, label):
    if value is None or (isinstance(value, str) and not value.strip()):
        raise HTTPException(status_code=400, detail=f"{label} is required.")


async def rank_by_token(token: str):
    return await db.ranks.find_one({'qr_token': token}, PROJ)


def haversine_m(lat1, lon1, lat2, lon2):
    R = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def make_qr(data: str) -> str:
    img = qrcode.make(data)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()


async def queue_snapshot(rank_name: str):
    entries = await db.queue.find({'rank_name': rank_name}, PROJ).sort('joined_at', 1).to_list(500)
    for i, e in enumerate(entries):
        e['position'] = i + 1
        if e.get('long_distance') and not e.get('long_distance_passengers'):
            req = await db.long_distance_requests.find_one(
                {'$or': [{'queue_id': e.get('id')}, {'taxi_registration': e.get('taxi_registration'), 'status': 'pending'}]},
                PROJ
            )
            if req and req.get('passengers'):
                e['long_distance_passengers'] = req['passengers']
    return entries


# ---------------- models ----------------
class LoginIn(BaseModel):
    role: str
    identifier: str
    secret: str


class RegisterIn(BaseModel):
    full_name: str
    contact_number: str
    email: str
    pin: str


class ChangeSecretIn(BaseModel):
    new_secret: str


class ProfileIn(BaseModel):
    email: Optional[str] = None
    contact_number: Optional[str] = None


class RankIn(BaseModel):
    rank_name: str
    location: str
    geo_lat: Optional[float] = None
    geo_lng: Optional[float] = None


class RouteIn(BaseModel):
    rank_name: str
    route: str
    fare: str


class OwnerIn(BaseModel):
    full_name: str
    email: str
    cell_phone: str
    rank_name: str
    pin: str


class MarshalIn(BaseModel):
    full_name: str
    cell_phone: str
    rank_name: str
    pin: str


class TaxiIn(BaseModel):
    registration: str
    seats: int
    route: str
    fare: str
    rank_name: Optional[str] = None
    owner_name: Optional[str] = None
    driver_name: str
    driver_cell: str
    driver_pin: str


class DriverReplaceIn(BaseModel):
    driver_name: str
    driver_cell: str
    driver_pin: str


class FareUpdateIn(BaseModel):
    route: str
    fare: str


class UpdateIn(BaseModel):
    title: str
    message: str
    status: str = "Active"


class GeoToggleIn(BaseModel):
    enabled: bool


class QueueAddIn(BaseModel):
    registration: str


class JoinIn(BaseModel):
    token: str
    lat: Optional[float] = None
    lng: Optional[float] = None


class LongPassenger(BaseModel):
    name: str
    contact: Optional[str] = ""
    destination: Optional[str] = ""
    kin_name: Optional[str] = ""
    kin_contact: Optional[str] = ""


class LongDistanceSaveIn(BaseModel):
    registration: str
    passengers: List[LongPassenger]


class DepartIn(BaseModel):
    long_distance_passengers: Optional[List[LongPassenger]] = None


class MarshalDepartIn(BaseModel):
    registration: str
    long_distance_passengers: Optional[List[LongPassenger]] = None


class SkipQueueIn(BaseModel):
    registration: str
    reason: str


class UpdateLocationIn(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    passenger_name: Optional[str] = None


class AskAiIn(BaseModel):
    message: str
    language: Optional[str] = "English"
    user_name: Optional[str] = None


# ---------------- auth ----------------
@api.post("/auth/login")
async def login(body: LoginIn):
    role = body.role.strip().lower()
    ident = body.identifier.strip()
    if role == 'admin':
        user = await db.users.find_one({'role': 'admin', 'email': ident.lower()})
    else:
        user = await db.users.find_one({'role': role, 'username': ident.lower()})
    if not user or not verify_secret(body.secret, user['secret_hash']):
        raise HTTPException(status_code=401, detail="Wrong details. Please check and try again.")
    token = create_token(user)
    user.pop('secret_hash', None)
    user.pop('_id', None)
    return {'token': token, 'user': user}


@api.post("/auth/register")
async def register(body: RegisterIn):
    username = body.full_name.strip().lower()
    if await db.users.find_one({'role': 'passenger', 'username': username}):
        raise HTTPException(status_code=400, detail="A passenger with this name already exists.")
    doc = {
        'id': str(uuid.uuid4()), 'role': 'passenger', 'full_name': body.full_name.strip(),
        'username': username, 'email': body.email.strip().lower(),
        'cell_phone': normalize_phone(body.contact_number), 'must_change': False,
        'secret_hash': hash_secret(body.pin), 'created_at': now_iso(),
    }
    await db.users.insert_one(doc)
    saved = await db.users.find_one({'id': doc['id']}, USER_PUB)
    return {'token': create_token(doc), 'user': saved}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


@api.post("/auth/change-secret")
async def change_secret(body: ChangeSecretIn, user=Depends(get_current_user)):
    if len(body.new_secret) < 4:
        raise HTTPException(status_code=400, detail="Choose at least 4 characters.")
    await db.users.update_one({'id': user['id']},
                              {'$set': {'secret_hash': hash_secret(body.new_secret),
                                        'must_change': False}})
    return {'ok': True}


@api.put("/profile")
async def update_profile(body: ProfileIn, user=Depends(get_current_user)):
    role = user['role']
    updates = {}
    if body.contact_number is not None:
        updates['cell_phone'] = normalize_phone(body.contact_number)
    if body.email is not None and role in ('admin', 'owner', 'passenger'):
        em = body.email.strip().lower()
        if em and '@' not in em:
            raise HTTPException(status_code=400, detail="Enter a valid email address.")
        updates['email'] = em
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update.")
    await db.users.update_one({'id': user['id']}, {'$set': updates})
    return await db.users.find_one({'id': user['id']}, USER_PUB)


# ---------------- public ----------------
@api.get("/public/ranks")
async def public_ranks():
    ranks = await db.ranks.find({}, {'_id': 0, 'qr_token': 0}).to_list(200)
    return ranks


@api.get("/public/routes")
async def public_routes():
    routes = await db.routes.find({}, PROJ).to_list(500)
    for r in routes:
        taxis = await db.taxis.find({'rank_name': r['rank_name'], 'route': r['route']},
                                    {'_id': 0, 'registration': 1}).to_list(100)
        r['taxis'] = [t['registration'] for t in taxis]
    return routes


@api.get("/public/updates")
async def public_updates():
    return await db.rank_updates.find({'status': 'Active'}, PROJ).sort('created_at', -1).to_list(100)


import difflib
from urllib.parse import quote_plus


@api.get("/public/search")
async def public_search(q: str = ""):
    q = q.strip()
    if not q:
        return {'ranks': [], 'routes': [], 'taxis': [], 'matched_query': ''}

    ranks = []
    routes = []
    taxis = []

    rx = {'$regex': q, '$options': 'i'}

    # 1b. Check if query contains origin-to-destination pattern (e.g. "Kimberley to Johannesburg" or "Kimberley - Johannesburg")
    import re
    arrow_pattern = re.split(r'\s+(?:to|->|—|–|-|↔)\s+', q, flags=re.I)
    multi_keywords = [part.strip() for part in arrow_pattern if part.strip()] if len(arrow_pattern) > 1 else []

    if multi_keywords:
        # User is searching for a pair like "Kimberley to Johannesburg"
        kw_regexes = [{'route': {'$regex': kw, '$options': 'i'}} for kw in multi_keywords]
        pair_routes = await db.routes.find({'$and': kw_regexes}, PROJ).to_list(50)
        for pr in pair_routes:
            if not any(r.get('rank_name') == pr.get('rank_name') and r.get('route') == pr.get('route') for r in routes):
                routes.append(pr)

    # 1. Exact / substring DB queries for ranks, routes, and taxis
    ranks_found = await db.ranks.find({'$or': [{'rank_name': rx}, {'location': rx}]},
                                      {'_id': 0, 'qr_token': 0}).to_list(50)
    for rf in ranks_found:
        if not any(r.get('rank_name') == rf.get('rank_name') for r in ranks):
            ranks.append(rf)

    routes_found = await db.routes.find({'$or': [{'route': rx}, {'rank_name': rx}]}, PROJ).to_list(50)
    for rf in routes_found:
        if not any(r.get('rank_name') == rf.get('rank_name') and r.get('route') == rf.get('route') for r in routes):
            routes.append(rf)

    taxis = await db.taxis.find({'$or': [{'registration': rx}, {'route': rx}, {'rank_name': rx}]},
                                {'_id': 0, 'registration': 1, 'rank_name': 1, 'route': 1,
                                 'fare_label': 1, 'seats': 1, 'driver_name': 1}).to_list(50)

    # If pair search was performed, also pull ranks mentioned in either part
    if multi_keywords:
        for kw in multi_keywords:
            kw_rx = {'$regex': kw, '$options': 'i'}
            kw_ranks = await db.ranks.find({'$or': [{'rank_name': kw_rx}, {'location': kw_rx}]},
                                           {'_id': 0, 'qr_token': 0}).to_list(20)
            for kr in kw_ranks:
                if not any(r.get('rank_name') == kr.get('rank_name') for r in ranks):
                    ranks.append(kr)

    # 2. Fuzzy / Typo tolerance for town/city names (e.g. "Johanesburg" -> "Johannesburg", "Kimberley" -> "Kimberly")
    all_ranks = await db.ranks.find({}, {'_id': 0, 'qr_token': 0}).to_list(200)
    existing_rank_names = {r['rank_name'] for r in ranks}
    q_lower = q.lower()

    for r in all_ranks:
        if r['rank_name'] in existing_rank_names:
            continue
        loc_lower = (r.get('location') or '').lower()
        name_lower = r['rank_name'].lower()
        
        sim_name = difflib.SequenceMatcher(None, q_lower, name_lower).ratio()
        sim_loc = difflib.SequenceMatcher(None, q_lower, loc_lower).ratio()
        
        words = loc_lower.split() + name_lower.split()
        max_word_sim = max([difflib.SequenceMatcher(None, q_lower, w).ratio() for w in words], default=0)

        if sim_name > 0.72 or sim_loc > 0.72 or max_word_sim > 0.78:
            ranks.append(r)
            existing_rank_names.add(r['rank_name'])

    # 3. If ranks were found for the searched town or name, pull all operating routes & active taxis for full info!
    if ranks:
        rank_names = [r['rank_name'] for r in ranks]
        extra_routes = await db.routes.find({'rank_name': {'$in': rank_names}}, PROJ).to_list(100)
        route_keys = {f"{r.get('rank_name')}--{r.get('route')}" for r in routes}
        for er in extra_routes:
            key = f"{er.get('rank_name')}--{er.get('route')}"
            if key not in route_keys:
                routes.append(er)
                route_keys.add(key)

        extra_taxis = await db.taxis.find({'rank_name': {'$in': rank_names}},
                                          {'_id': 0, 'registration': 1, 'rank_name': 1, 'route': 1,
                                           'fare_label': 1, 'seats': 1, 'driver_name': 1}).to_list(100)
        taxi_regs = {t['registration'] for t in taxis}
        for et in extra_taxis:
            if et['registration'] not in taxi_regs:
                taxis.append(et)
                taxi_regs.add(et['registration'])

    # 4. Enrich rank cards with Google Maps links and coordinates for easy passenger navigation
    for r in ranks:
        name = r.get('rank_name', '')
        loc = r.get('location', '')
        query_text = f"{name}, {loc}, South Africa" if loc else f"{name}, South Africa"
        r['google_maps_url'] = f"https://www.google.com/maps/search/?api=1&query={quote_plus(query_text)}"
        if r.get('geo_lat') and r.get('geo_lng'):
            r['google_directions_url'] = f"https://www.google.com/maps/dir/?api=1&destination={r['geo_lat']},{r['geo_lng']}"
        else:
            r['google_directions_url'] = r['google_maps_url']

    return {'ranks': ranks, 'routes': routes, 'taxis': taxis, 'matched_query': q}


@api.get("/passenger/search")
async def passenger_search(q: str = ""):
    return await public_search(q)


@api.get("/public/taxi/{registration}")
async def public_taxi(registration: str):
    t = await db.taxis.find_one({'registration': {'$regex': f'^{registration}$', '$options': 'i'}},
                                {'_id': 0, 'registration': 1, 'rank_name': 1, 'route': 1,
                                 'fare_label': 1, 'driver_name': 1, 'driver_id': 1})
    if not t:
        raise HTTPException(status_code=404, detail="No taxi found with that registration.")
    driver_id = t.pop('driver_id', None)
    driver_contact = None
    if driver_id:
        d = await db.users.find_one({'id': driver_id}, {'_id': 0, 'cell_phone': 1})
        driver_contact = d.get('cell_phone') if d else None
    t['driver_contact'] = driver_contact
    t['verified'] = True
    base = APP_BASE_URL.rstrip('/') if APP_BASE_URL else 'https://erank.onrender.com'
    t['share_url'] = f"{base}/t/{t['registration'].replace(' ', '%20')}"
    return t


# ---------------- admin ----------------
admin_dep = require_role('admin')


@api.get("/admin/overview")
async def admin_overview(user=Depends(admin_dep)):
    return {
        'owners': await db.users.count_documents({'role': 'owner'}),
        'marshals': await db.users.count_documents({'role': 'marshal'}),
        'drivers': await db.users.count_documents({'role': 'driver'}),
        'taxis': await db.taxis.count_documents({}),
        'ranks': await db.ranks.count_documents({}),
        'routes': await db.routes.count_documents({}),
        'active_queue': await db.queue.count_documents({}),
        'operations': await db.operations.count_documents({}),
    }


@api.get("/admin/users/{role}")
async def admin_users(role: str, user=Depends(admin_dep)):
    return await db.users.find({'role': role}, USER_PUB).to_list(1000)


@api.post("/admin/ranks")
async def create_rank(body: RankIn, user=Depends(admin_dep)):
    _need(body.rank_name, "Rank name")
    _need(body.location, "Location")
    if await db.ranks.find_one({'rank_name': body.rank_name}):
        raise HTTPException(status_code=400, detail="Rank already exists.")
    doc = {'id': str(uuid.uuid4()), 'rank_name': body.rank_name, 'location': body.location,
           'geo_lat': body.geo_lat, 'geo_lng': body.geo_lng, 'geo_check_enabled': False,
           'qr_token': str(uuid.uuid4())}
    await db.ranks.insert_one(doc)
    return await db.ranks.find_one({'id': doc['id']}, {'_id': 0, 'qr_token': 0})


@api.delete("/admin/ranks/{rank_id}")
async def delete_rank(rank_id: str, user=Depends(admin_dep)):
    await db.ranks.delete_one({'id': rank_id})
    return {'ok': True}


@api.post("/admin/routes")
async def create_route(body: RouteIn, user=Depends(admin_dep)):
    _need(body.rank_name, "Rank")
    _need(body.route, "Route")
    _need(body.fare, "Fare")
    doc = {'id': str(uuid.uuid4()), 'rank_name': body.rank_name, 'route': body.route,
           'fare_amount': fare_to_int(body.fare), 'fare_label': fare_label(body.fare)}
    await db.routes.insert_one(doc)
    return await db.routes.find_one({'id': doc['id']}, PROJ)


@api.delete("/admin/routes/{route_id}")
async def delete_route(route_id: str, user=Depends(admin_dep)):
    await db.routes.delete_one({'id': route_id})
    return {'ok': True}


@api.post("/admin/owners")
async def create_owner(body: OwnerIn, user=Depends(admin_dep)):
    _need(body.full_name, "Owner full name")
    _need(body.email, "Owner email")
    _need(body.cell_phone, "Owner cell number")
    _need(body.rank_name, "Rank")
    _need(body.pin, "Initial PIN")
    if '@' not in body.email:
        raise HTTPException(status_code=400, detail="Enter a valid email address.")
    uname = body.full_name.strip().lower()
    if await db.users.find_one({'role': 'owner', 'username': uname}):
        raise HTTPException(status_code=400, detail="Owner already exists.")
    doc = {'id': str(uuid.uuid4()), 'role': 'owner', 'full_name': body.full_name.strip(),
           'username': uname, 'email': body.email.strip().lower(),
           'cell_phone': normalize_phone(body.cell_phone), 'rank_name': body.rank_name,
           'must_change': True, 'secret_hash': hash_secret(body.pin), 'created_at': now_iso()}
    await db.users.insert_one(doc)
    return await db.users.find_one({'id': doc['id']}, USER_PUB)


@api.post("/admin/marshals")
async def create_marshal(body: MarshalIn, user=Depends(admin_dep)):
    _need(body.full_name, "Marshal full name")
    _need(body.cell_phone, "Marshal cell number")
    _need(body.rank_name, "Rank")
    _need(body.pin, "Initial PIN")
    uname = body.full_name.strip().lower()
    if await db.users.find_one({'role': 'marshal', 'username': uname}):
        raise HTTPException(status_code=400, detail="Marshal already exists.")
    doc = {'id': str(uuid.uuid4()), 'role': 'marshal', 'full_name': body.full_name.strip(),
           'username': uname, 'cell_phone': normalize_phone(body.cell_phone),
           'rank_name': body.rank_name, 'must_change': True,
           'secret_hash': hash_secret(body.pin), 'created_at': now_iso()}
    await db.users.insert_one(doc)
    return await db.users.find_one({'id': doc['id']}, USER_PUB)


@api.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, user=Depends(admin_dep)):
    target = await db.users.find_one({'id': user_id})
    if target and target['role'] == 'driver':
        raise HTTPException(status_code=400, detail="Remove the taxi to remove its driver.")
    await db.users.delete_one({'id': user_id})
    return {'ok': True}


@api.get("/admin/taxis")
async def admin_taxis(user=Depends(admin_dep)):
    return await db.taxis.find({}, PROJ).to_list(1000)


@api.get("/admin/queue")
async def admin_queue(user=Depends(admin_dep)):
    return await db.queue.find({}, PROJ).sort('joined_at', 1).to_list(1000)


@api.get("/admin/operations")
async def admin_operations(user=Depends(admin_dep)):
    return await db.operations.find({}, PROJ).sort('departed_at', -1).to_list(1000)


@api.get("/admin/sos")
async def admin_sos(user=Depends(admin_dep)):
    return await db.sos_events.find({}, PROJ).sort('created_at', -1).to_list(500)


# ---------------- owner ----------------
owner_dep = require_role('owner')


@api.get("/owner/taxis")
async def owner_taxis(user=Depends(owner_dep)):
    return await db.taxis.find({'owner_name': user['full_name']}, PROJ).to_list(500)


@api.get("/owner/drivers")
async def owner_drivers(user=Depends(owner_dep)):
    return await db.users.find({'role': 'driver', 'owner_name': user['full_name']},
                               USER_PUB).to_list(500)


@api.post("/owner/taxis")
async def owner_add_taxi(body: TaxiIn, user=Depends(owner_dep)):
    _need(body.registration, "Taxi registration")
    _need(body.route, "Route")
    _need(body.fare, "Fare")
    _need(body.driver_name, "Driver name")
    _need(body.driver_cell, "Driver cell number")
    _need(body.driver_pin, "Driver PIN")
    if not body.seats or body.seats <= 0:
        raise HTTPException(status_code=400, detail="Seats must be greater than zero.")
    if await db.users.find_one({'role': 'driver', 'username': body.driver_name.strip().lower()}):
        raise HTTPException(status_code=400, detail="A driver with this name already exists.")
    if await db.taxis.find_one({'registration': body.registration.strip()}):
        raise HTTPException(status_code=400, detail="A taxi with this registration already exists.")
    rank = user.get('rank_name')
    dname = body.driver_name.strip()
    duser = {'id': str(uuid.uuid4()), 'role': 'driver', 'full_name': dname,
             'username': dname.lower(), 'cell_phone': normalize_phone(body.driver_cell),
             'owner_name': user['full_name'], 'taxi_registration': body.registration.strip(),
             'rank_name': rank, 'must_change': True,
             'secret_hash': hash_secret(body.driver_pin), 'created_at': now_iso()}
    await db.users.insert_one(duser)
    doc = {'id': str(uuid.uuid4()), 'registration': body.registration.strip(),
           'seats': body.seats, 'owner_name': user['full_name'], 'driver_name': dname,
           'driver_id': duser['id'], 'rank_name': rank, 'route': body.route,
           'fare_amount': fare_to_int(body.fare), 'fare_label': fare_label(body.fare),
           'active_queue': False}
    await db.taxis.insert_one(doc)
    return await db.taxis.find_one({'id': doc['id']}, PROJ)


@api.put("/owner/taxis/{registration}/driver")
async def owner_replace_driver(registration: str, body: DriverReplaceIn, user=Depends(owner_dep)):
    _need(body.driver_name, "Driver name")
    _need(body.driver_cell, "Driver cell number")
    _need(body.driver_pin, "Driver PIN")
    taxi = await db.taxis.find_one({'registration': registration, 'owner_name': user['full_name']})
    if not taxi:
        raise HTTPException(status_code=404, detail="Taxi not found.")
    if taxi.get('active_queue'):
        raise HTTPException(status_code=400, detail="Cannot change driver while the taxi is in a queue.")
    if taxi.get('driver_id'):
        await db.users.delete_one({'id': taxi['driver_id']})
    dname = body.driver_name.strip()
    duser = {'id': str(uuid.uuid4()), 'role': 'driver', 'full_name': dname,
             'username': dname.lower(), 'cell_phone': normalize_phone(body.driver_cell),
             'owner_name': user['full_name'], 'taxi_registration': registration,
             'rank_name': taxi['rank_name'], 'must_change': True,
             'secret_hash': hash_secret(body.driver_pin), 'created_at': now_iso()}
    await db.users.insert_one(duser)
    await db.taxis.update_one({'registration': registration},
                              {'$set': {'driver_name': dname, 'driver_id': duser['id']}})
    return await db.taxis.find_one({'registration': registration}, PROJ)


@api.get("/owner/revenue")
async def owner_revenue(user=Depends(owner_dep)):
    ops = await db.operations.find({'owner_name': user['full_name']}, PROJ).to_list(5000)
    total = sum(o.get('revenue', 0) for o in ops)
    per_taxi = {}
    for o in ops:
        per_taxi.setdefault(o['taxi_registration'], {'registration': o['taxi_registration'],
                                                      'trips': 0, 'revenue': 0})
        per_taxi[o['taxi_registration']]['trips'] += 1
        per_taxi[o['taxi_registration']]['revenue'] += o.get('revenue', 0)
    return {'total_revenue': total, 'total_trips': len(ops),
            'per_taxi': list(per_taxi.values()),
            'operations': sorted(ops, key=lambda x: x.get('departed_at', ''), reverse=True)[:200]}


@api.get("/owner/revenue/export")
async def owner_revenue_export(user=Depends(owner_dep)):
    owner_name = user['full_name']
    ops = await db.operations.find({'owner_name': owner_name}, PROJ).sort('departed_at', -1).to_list(10000)

    wb = Workbook()
    ws = wb.active
    ws.title = "Revenue Statement"
    ws.views.sheetView[0].showGridLines = True

    COLOR_BRAND_DARK = "0F172A"    # Deep Slate
    COLOR_BRAND_EMERALD = "059669" # Rich Emerald
    COLOR_HEADER_BG = "1E293B"     # Slate Navy
    COLOR_ZEBRA = "F8FAFC"         # Soft Zebra Stripe
    COLOR_WHITE = "FFFFFF"
    COLOR_BORDER = "CBD5E1"        # Clean Border

    font_title = Font(name="Calibri", size=15, bold=True, color=COLOR_WHITE)
    font_subtitle = Font(name="Calibri", size=10, italic=True, color="CBD5E1")
    font_card_lbl = Font(name="Calibri", size=9, bold=True, color="64748B")
    font_card_val = Font(name="Calibri", size=13, bold=True, color="0F172A")
    font_card_val_em = Font(name="Calibri", size=13, bold=True, color=COLOR_BRAND_EMERALD)

    font_th = Font(name="Calibri", size=11, bold=True, color=COLOR_WHITE)
    font_td = Font(name="Calibri", size=10, color="1E293B")
    font_td_bold = Font(name="Calibri", size=10, bold=True, color="1E293B")
    font_total = Font(name="Calibri", size=11, bold=True, color="0F172A")

    fill_banner = PatternFill(start_color=COLOR_BRAND_DARK, end_color=COLOR_BRAND_DARK, fill_type="solid")
    fill_subbanner = PatternFill(start_color="334155", end_color="334155", fill_type="solid")
    fill_card = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    fill_card_em = PatternFill(start_color="ECFDF5", end_color="ECFDF5", fill_type="solid")
    fill_th = PatternFill(start_color=COLOR_HEADER_BG, end_color=COLOR_HEADER_BG, fill_type="solid")
    fill_zebra = PatternFill(start_color=COLOR_ZEBRA, end_color=COLOR_ZEBRA, fill_type="solid")
    fill_white = PatternFill(start_color=COLOR_WHITE, end_color=COLOR_WHITE, fill_type="solid")
    fill_total = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")

    thin_border_side = Side(style="thin", color=COLOR_BORDER)
    thin_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)

    double_bottom_side = Side(style="double", color="0F172A")
    top_thin_side = Side(style="thin", color="0F172A")
    total_border = Border(top=top_thin_side, bottom=double_bottom_side, left=thin_border_side, right=thin_border_side)

    align_center = Alignment(horizontal="center", vertical="center")
    align_left = Alignment(horizontal="left", vertical="center")
    align_right = Alignment(horizontal="right", vertical="center")

    # 1. Main Title Banner (Row 1)
    ws.merge_cells("A1:I1")
    cell_a1 = ws["A1"]
    cell_a1.value = "E-RANK OPERATIONS PLATFORM  |  OFFICIAL FLEET REVENUE STATEMENT"
    cell_a1.font = font_title
    cell_a1.fill = fill_banner
    cell_a1.alignment = align_center
    ws.row_dimensions[1].height = 36

    # 2. Sub-header (Row 2)
    ws.merge_cells("A2:I2")
    cell_a2 = ws["A2"]
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    cell_a2.value = f"Fleet Owner: {owner_name.upper()}   ·   Exported: {now_str} UTC   ·   Confidential Audit Statement"
    cell_a2.font = font_subtitle
    cell_a2.fill = fill_subbanner
    cell_a2.alignment = align_center
    ws.row_dimensions[2].height = 22

    ws.row_dimensions[3].height = 10

    # 3. KPI Summary Cards (Rows 4-5)
    total_rev = sum(o.get('revenue', 0) for o in ops)
    total_trips = len(ops)
    unique_taxis = len(set(o.get('taxi_registration') for o in ops if o.get('taxi_registration')))
    ld_trips = sum(1 for o in ops if o.get('long_distance'))
    ld_rev = sum(o.get('revenue', 0) for o in ops if o.get('long_distance'))

    # Card 1: Total Revenue
    ws.merge_cells("A4:B4")
    ws["A4"] = "TOTAL REVENUE"
    ws["A4"].font = font_card_lbl
    ws["A4"].fill = fill_card_em
    ws["A4"].alignment = align_center
    ws.merge_cells("A5:B5")
    ws["A5"] = total_rev
    ws["A5"].number_format = '"R "#,##0.00'
    ws["A5"].font = font_card_val_em
    ws["A5"].fill = fill_card_em
    ws["A5"].alignment = align_center

    # Card 2: Total Trips
    ws.merge_cells("C4:D4")
    ws["C4"] = "COMPLETED TRIPS"
    ws["C4"].font = font_card_lbl
    ws["C4"].fill = fill_card
    ws["C4"].alignment = align_center
    ws.merge_cells("C5:D5")
    ws["C5"] = f"{total_trips} Trips"
    ws["C5"].font = font_card_val
    ws["C5"].fill = fill_card
    ws["C5"].alignment = align_center

    # Card 3: Active Vehicles
    ws.merge_cells("E4:F4")
    ws["E4"] = "ACTIVE TAXIS"
    ws["E4"].font = font_card_lbl
    ws["E4"].fill = fill_card
    ws["E4"].alignment = align_center
    ws.merge_cells("E5:F5")
    ws["E5"] = f"{unique_taxis} Vehicles"
    ws["E5"].font = font_card_val
    ws["E5"].fill = fill_card
    ws["E5"].alignment = align_center

    # Card 4: Long Distance Revenue
    ws.merge_cells("G4:I4")
    ws["G4"] = "LONG-DISTANCE REVENUE"
    ws["G4"].font = font_card_lbl
    ws["G4"].fill = fill_card
    ws["G4"].alignment = align_center
    ws.merge_cells("G5:I5")
    ws["G5"] = f"R {ld_rev:,.2f}  ({ld_trips} trips)"
    ws["G5"].font = font_card_val
    ws["G5"].fill = fill_card
    ws["G5"].alignment = align_center

    for r in range(4, 6):
        ws.row_dimensions[r].height = 20
        for c in range(1, 10):
            ws.cell(row=r, column=c).border = thin_border

    ws.row_dimensions[6].height = 12

    # 4. Table Headers (Row 7)
    headers = [
        ("Departure Date & Time", align_center),
        ("Taxi Registration", align_center),
        ("Driver Name", align_left),
        ("Rank Name", align_left),
        ("Route Name", align_left),
        ("Trip Type", align_center),
        ("Seats", align_right),
        ("Fare per Seat", align_right),
        ("Total Revenue", align_right),
    ]
    ws.row_dimensions[7].height = 26
    for col_idx, (title, align) in enumerate(headers, 1):
        c = ws.cell(row=7, column=col_idx)
        c.value = title
        c.font = font_th
        c.fill = fill_th
        c.alignment = align
        c.border = thin_border

    # 5. Data Rows (Row 8+)
    cur_row = 8
    for o in ops:
        ws.row_dimensions[cur_row].height = 20
        is_even = (cur_row % 2 == 0)
        row_fill = fill_zebra if is_even else fill_white

        raw_date = str(o.get('departed_at', ''))
        if 'T' in raw_date:
            date_disp = raw_date.replace('T', ' ').split('.')[0][:16]
        else:
            date_disp = raw_date[:16]

        taxi_reg = o.get('taxi_registration', '—')
        driver_name = o.get('driver_name', '—')
        rank_name = o.get('rank_name', '—')
        route_name = o.get('route', '—')
        is_ld = bool(o.get('long_distance'))
        trip_type = "Long-Distance" if is_ld else "Local"
        seats = o.get('seats', 0)
        fare_amt = o.get('fare_amount', 0)
        rev = o.get('revenue', 0)

        row_data = [
            (date_disp, align_center, font_td, None),
            (taxi_reg, align_center, font_td_bold, None),
            (driver_name, align_left, font_td, None),
            (rank_name, align_left, font_td, None),
            (route_name, align_left, font_td, None),
            (trip_type, align_center, Font(name="Calibri", size=10, bold=is_ld, color="B45309" if is_ld else "475569"), None),
            (seats, align_right, font_td, '#,##0'),
            (fare_amt, align_right, font_td, '"R "#,##0.00'),
            (rev, align_right, font_td_bold, '"R "#,##0.00'),
        ]

        for col_idx, (val, align, f_style, num_fmt) in enumerate(row_data, 1):
            cell = ws.cell(row=cur_row, column=col_idx)
            cell.value = val
            cell.alignment = align
            cell.font = f_style
            cell.fill = row_fill
            cell.border = thin_border
            if num_fmt:
                cell.number_format = num_fmt

        cur_row += 1

    # 6. Grand Total Row
    ws.row_dimensions[cur_row].height = 28
    ws.merge_cells(start_row=cur_row, start_column=1, end_row=cur_row, end_column=8)
    total_lbl = ws.cell(row=cur_row, column=1)
    total_lbl.value = "GRAND TOTAL FLEET REVENUE"
    total_lbl.font = font_total
    total_lbl.alignment = align_right
    total_lbl.fill = fill_total
    total_lbl.border = total_border

    for c_idx in range(2, 9):
        ws.cell(row=cur_row, column=c_idx).border = total_border
        ws.cell(row=cur_row, column=c_idx).fill = fill_total

    total_val = ws.cell(row=cur_row, column=9)
    total_val.value = f"=SUM(I8:I{cur_row - 1})" if cur_row > 8 else total_rev
    total_val.number_format = '"R "#,##0.00'
    total_val.font = Font(name="Calibri", size=12, bold=True, color=COLOR_BRAND_EMERALD)
    total_val.alignment = align_right
    total_val.fill = fill_total
    total_val.border = total_border

    # 7. Column Auto-Widths with generous padding
    min_widths = {
        1: 20,  # Date
        2: 18,  # Taxi
        3: 20,  # Driver Name
        4: 18,  # Rank
        5: 26,  # Route
        6: 16,  # Trip Type
        7: 10,  # Seats
        8: 16,  # Fare
        9: 20,  # Revenue
    }
    for col_idx, min_w in min_widths.items():
        col_letter = get_column_letter(col_idx)
        max_len = min_w
        for row in range(7, cur_row + 1):
            val = ws.cell(row=row, column=col_idx).value
            if val is not None:
                max_len = max(max_len, len(str(val)) + 3)
        ws.column_dimensions[col_letter].width = max(max_len, min_w)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    fn = f"erank_revenue_{owner_name.replace(' ', '_')}.xlsx"
    return StreamingResponse(
        buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{fn}"'})


# ---------------- marshal ----------------
marshal_dep = require_role('marshal')


async def marshal_rank(user):
    rank = await db.ranks.find_one({'rank_name': user['rank_name']}, PROJ)
    if not rank:
        raise HTTPException(status_code=404, detail="Your rank was not found.")
    return rank


@api.get("/marshal/rank")
async def marshal_rank_info(user=Depends(marshal_dep)):
    rank = await marshal_rank(user)
    rank['queue_count'] = await db.queue.count_documents({'rank_name': rank['rank_name']})
    return rank


@api.get("/marshal/queue")
async def marshal_queue(user=Depends(marshal_dep)):
    return await queue_snapshot(user['rank_name'])


@api.get("/marshal/taxis")
async def marshal_taxis(user=Depends(marshal_dep)):
    return await db.taxis.find({'rank_name': user['rank_name']}, PROJ).to_list(500)


@api.get("/marshal/routes")
async def marshal_routes(user=Depends(marshal_dep)):
    return await db.routes.find({'rank_name': user['rank_name']}, PROJ).to_list(200)


@api.post("/marshal/queue/add")
async def marshal_queue_add(body: QueueAddIn, user=Depends(marshal_dep)):
    reg = body.registration.strip()
    taxi = await db.taxis.find_one({'registration': {'$regex': f'^{reg}$', '$options': 'i'}})
    if not taxi:
        raise HTTPException(status_code=404, detail="No taxi found with that registration.")
    if taxi['rank_name'] != user['rank_name']:
        raise HTTPException(status_code=400, detail="That taxi does not belong to your rank.")
    if taxi.get('active_queue'):
        raise HTTPException(status_code=400, detail="This taxi is already in the queue.")
    entry = {'id': str(uuid.uuid4()), 'taxi_registration': taxi['registration'],
             'rank_name': taxi['rank_name'], 'driver_id': taxi.get('driver_id'),
             'driver_name': taxi.get('driver_name'), 'owner_name': taxi.get('owner_name'),
             'route': taxi['route'], 'seats': taxi['seats'],
             'fare_amount': taxi['fare_amount'], 'fare_label': taxi['fare_label'],
             'long_distance': is_long_distance(taxi['route']),
             'status': 'waiting', 'joined_at': now_iso(), 'added_by': 'marshal'}
    await db.queue.insert_one(entry)
    # If this is a long‑distance route, create a pending long‑distance request linked to the queue entry
    if entry['long_distance']:
        request_doc = {
            'id': str(uuid.uuid4()),
            'queue_id': entry['id'],
            'taxi_registration': taxi['registration'],
            'rank_name': taxi['rank_name'],
            'driver_name': taxi.get('driver_name') or 'Driver',
            'route': taxi['route'],
            'seat_count': taxi['seats'],
            'passengers': [],
            'status': 'pending',
            'created_at': now_iso()
        }
        await db.long_distance_requests.insert_one(request_doc)
    await db.taxis.update_one({'id': taxi['id']}, {'$set': {'active_queue': True}})
    return {'ok': True}


@api.post("/marshal/long-distance/save")
async def marshal_save_manifest(body: LongDistanceSaveIn, user=Depends(marshal_dep)):
    reg = body.registration.strip()
    entry = await db.queue.find_one({'taxi_registration': {'$regex': f'^{reg}$', '$options': 'i'},
                                     'rank_name': user['rank_name']})
    if not entry:
        raise HTTPException(status_code=400, detail="That taxi is not currently in your queue.")
    passengers = [p.dict() for p in body.passengers if p.name.strip()]
    await db.queue.update_one(
        {'id': entry['id']},
        {'$set': {'long_distance_passengers': passengers}}
    )
    await db.long_distance_requests.update_many(
        {'taxi_registration': {'$regex': f'^{reg}$', '$options': 'i'}, 'status': 'pending'},
        {'$set': {'passengers': passengers, 'updated_at': now_iso()}}
    )
    return {'ok': True, 'count': len(passengers), 'passengers': passengers}


@api.post("/marshal/queue/depart")
async def marshal_queue_depart(body: MarshalDepartIn, user=Depends(marshal_dep)):
    reg = body.registration.strip()
    entry = await db.queue.find_one({'taxi_registration': {'$regex': f'^{reg}$', '$options': 'i'},
                                     'rank_name': user['rank_name']})
    if not entry:
        raise HTTPException(status_code=400, detail="That taxi is not in your queue.")
    long_pax = [p.dict() for p in (body.long_distance_passengers or []) if p.name.strip()]
    if not long_pax and entry.get('long_distance_passengers'):
        long_pax = entry.get('long_distance_passengers')
    if not long_pax and entry.get('long_distance'):
        req = await db.long_distance_requests.find_one(
            {'taxi_registration': {'$regex': f'^{reg}$', '$options': 'i'}, 'status': 'pending'},
            sort=[('created_at', -1)]
        )
        if req and req.get('passengers'):
            long_pax = req.get('passengers')

    if entry.get('long_distance') and not long_pax:
        raise HTTPException(status_code=400,
                            detail="Capture long-distance passenger details before departing.")
    revenue = entry['fare_amount'] * entry['seats']
    op = {'id': str(uuid.uuid4()), 'taxi_registration': entry['taxi_registration'],
          'rank_name': entry['rank_name'], 'owner_name': entry['owner_name'],
          'driver_name': entry['driver_name'], 'route': entry['route'],
          'seats': entry['seats'], 'fare_amount': entry['fare_amount'],
          'revenue': revenue, 'long_distance': entry.get('long_distance', False),
          'long_distance_passengers': long_pax, 'departed_at': now_iso(), 'departed_by': 'marshal'}
    await db.operations.insert_one(op)
    await db.queue.delete_one({'id': entry['id']})
    await db.taxis.update_one({'registration': entry['taxi_registration']},
                              {'$set': {'active_queue': False}})
    await db.long_distance_requests.update_many(
        {'taxi_registration': {'$regex': f'^{reg}$', '$options': 'i'}, 'status': 'pending'},
        {'$set': {'status': 'departed', 'passengers': long_pax, 'departed_at': now_iso()}}
    )
    return {'ok': True, 'revenue': revenue}


@api.post("/marshal/queue/skip")
async def marshal_queue_skip(body: SkipQueueIn, user=Depends(marshal_dep)):
    reg = body.registration.strip()
    reason = body.reason.strip() or "Taxi skipped in queue by rank marshal."
    rank_name = user['rank_name']

    entries = await db.queue.find({'rank_name': rank_name}, PROJ).sort('joined_at', 1).to_list(500)
    idx = next((i for i, e in enumerate(entries) if e['taxi_registration'].strip().upper() == reg.upper()), None)
    if idx is None:
        raise HTTPException(status_code=400, detail=f"Taxi {reg} is not in your queue.")
    if idx >= len(entries) - 1:
        raise HTTPException(status_code=400, detail=f"Taxi {reg} is already at the end of the queue.")

    curr_entry = entries[idx]
    next_entry = entries[idx + 1]

    # Swap joined_at timestamps so next taxi moves ahead and curr_entry moves back 1 position
    t_curr = curr_entry['joined_at']
    t_next = next_entry['joined_at']

    # Ensure distinct ordering
    if t_curr == t_next:
        from datetime import datetime, timezone, timedelta
        dt = datetime.fromisoformat(t_curr.replace('Z', '+00:00'))
        t_next = (dt + timedelta(seconds=1)).isoformat()

    await db.queue.update_one({'id': curr_entry['id']}, {'$set': {'joined_at': t_next}})
    await db.queue.update_one({'id': next_entry['id']}, {'$set': {'joined_at': t_curr}})

    # Create in-app notification for the driver
    taxi = await db.taxis.find_one({'registration': {'$regex': f'^{reg}$', '$options': 'i'}})
    driver_id = curr_entry.get('driver_id') or (taxi.get('driver_id') if taxi else None)
    notif_doc = {
        'id': str(uuid.uuid4()),
        'taxi_registration': reg,
        'driver_id': driver_id,
        'driver_name': curr_entry.get('driver_name'),
        'rank_name': rank_name,
        'title': "⚠️ Queue Position Skipped",
        'message': f"Your taxi was moved back in the queue at {rank_name}. Reason: {reason}",
        'reason': reason,
        'marshal_name': user['full_name'],
        'created_at': now_iso(),
        'read': False,
    }
    await db.notifications.insert_one(notif_doc)

    return {'ok': True, 'skipped': reg, 'new_position': idx + 2, 'reason': reason}


@api.post("/marshal/fare")
async def marshal_fare(body: FareUpdateIn, user=Depends(marshal_dep)):
    amount = fare_to_int(body.fare)
    label = fare_label(body.fare)
    await db.routes.update_one({'rank_name': user['rank_name'], 'route': body.route},
                               {'$set': {'fare_amount': amount, 'fare_label': label}})
    await db.taxis.update_many({'rank_name': user['rank_name'], 'route': body.route},
                               {'$set': {'fare_amount': amount, 'fare_label': label}})
    return {'ok': True}


@api.get("/marshal/updates")
async def marshal_updates(user=Depends(marshal_dep)):
    return await db.rank_updates.find({'rank_name': user['rank_name']}, PROJ).sort('created_at', -1).to_list(200)


@api.post("/marshal/updates")
async def marshal_create_update(body: UpdateIn, user=Depends(marshal_dep)):
    doc = {'id': str(uuid.uuid4()), 'marshal_name': user['full_name'],
           'rank_name': user['rank_name'], 'title': body.title, 'message': body.message,
           'status': body.status, 'created_at': now_iso()}
    await db.rank_updates.insert_one(doc)
    return await db.rank_updates.find_one({'id': doc['id']}, PROJ)


@api.delete("/marshal/updates/{update_id}")
async def marshal_delete_update(update_id: str, user=Depends(marshal_dep)):
    await db.rank_updates.delete_one({'id': update_id, 'rank_name': user['rank_name']})
    return {'ok': True}


@api.get("/marshal/qr")
async def marshal_qr(user=Depends(marshal_dep)):
    rank = await marshal_rank(user)
    url = f"{APP_BASE_URL}/scan?token={rank['qr_token']}"
    return {'rank_name': rank['rank_name'], 'token': rank['qr_token'], 'url': url,
            'image': make_qr(url), 'geo_check_enabled': rank.get('geo_check_enabled', False)}


@api.post("/marshal/qr/regenerate")
async def marshal_qr_regen(user=Depends(marshal_dep)):
    new_token = str(uuid.uuid4())
    await db.ranks.update_one({'rank_name': user['rank_name']}, {'$set': {'qr_token': new_token}})
    return await marshal_qr(user)


@api.post("/marshal/geo-check")
async def marshal_geo(body: GeoToggleIn, user=Depends(marshal_dep)):
    await db.ranks.update_one({'rank_name': user['rank_name']},
                              {'$set': {'geo_check_enabled': body.enabled}})
    return {'geo_check_enabled': body.enabled}


# ---------------- driver ----------------
driver_dep = require_role('driver')


async def driver_taxi(user):
    return await db.taxis.find_one({'registration': user.get('taxi_registration')})


@api.get("/driver/status")
async def driver_status(user=Depends(driver_dep)):
    taxi = await driver_taxi(user)
    if not taxi:
        raise HTTPException(status_code=404, detail="No taxi assigned to you.")
    entries = await queue_snapshot(taxi['rank_name'])
    mine = next((e for e in entries if e['taxi_registration'] == taxi['registration']), None)
    rank = await db.ranks.find_one({'rank_name': taxi['rank_name']}, PROJ)
    # Fetch unread notifications for this driver / taxi
    notifs = await db.notifications.find(
        {'$or': [{'taxi_registration': taxi['registration']}, {'driver_id': user['id']}]},
        PROJ
    ).sort('created_at', -1).to_list(20)

    return {
        'taxi': {k: taxi.get(k) for k in ('registration', 'rank_name', 'route', 'seats',
                                          'fare_label', 'fare_amount', 'active_queue')},
        'assigned_rank': taxi['rank_name'],
        'geo_check_enabled': rank.get('geo_check_enabled', False) if rank else False,
        'in_queue': mine is not None,
        'position': mine['position'] if mine else None,
        'queue_length': len(entries),
        'long_distance': is_long_distance(taxi['route']),
        'entry': mine,
        'queue': entries,
        'notifications': notifs,
    }


@api.post("/driver/notifications/{notif_id}/read")
async def driver_read_notification(notif_id: str, user=Depends(driver_dep)):
    await db.notifications.update_one({'id': notif_id}, {'$set': {'read': True}})
    return {'ok': True}


@api.get("/driver/queue")
async def driver_queue(user=Depends(driver_dep)):
    taxi = await driver_taxi(user)
    if not taxi:
        raise HTTPException(status_code=404, detail="No taxi assigned to you.")
    return await queue_snapshot(taxi['rank_name'])


@api.post("/driver/join")
async def driver_join(body: JoinIn, user=Depends(driver_dep)):
    rank = await rank_by_token(body.token)
    if not rank:
        raise HTTPException(status_code=400, detail="This QR code is not valid.")
    taxi = await driver_taxi(user)
    if not taxi:
        raise HTTPException(status_code=404, detail="No taxi assigned to you.")

    # --- Dual-rank check for long-distance taxis ---
    # Long-distance taxis can scan into EITHER their home rank OR the destination rank
    # (the other rank name in the route string, separated by ↔ or →).
    taxi_home_rank = taxi['rank_name']
    scanned_rank = rank['rank_name']
    taxi_is_long_distance = is_long_distance(taxi['route'])

    allowed_ranks = {taxi_home_rank}
    if taxi_is_long_distance:
        # Extract both sides of the route to allow joining at destination rank
        route_parts = re.split(r'[↔→]', taxi['route'])
        for part in route_parts:
            part = part.strip()
            if part:
                allowed_ranks.add(part)
        # Also check if any known rank name appears as a substring in route parts
        # This handles cases like "Indian Center Kimberly" matching rank "Indian Center"
        all_ranks_cursor = db.ranks.find({}, {'rank_name': 1, '_id': 0})
        async for r in all_ranks_cursor:
            rn = r['rank_name']
            for part in route_parts:
                if rn.lower() in part.strip().lower():
                    allowed_ranks.add(rn)

    if scanned_rank not in allowed_ranks:
        raise HTTPException(
            status_code=400,
            detail=f"Wrong rank. Your taxi operates between {' ↔ '.join(sorted(allowed_ranks))}."
        )

    # Use the scanned rank for queue entry so revenue is recorded at the correct rank
    joining_rank = scanned_rank

    if rank.get('geo_check_enabled'):
        if body.lat is None or body.lng is None:
            raise HTTPException(status_code=400,
                                detail="Location sharing is required to join this rank. Please enable GPS and try again.")
        if rank.get('geo_lat') is not None and rank.get('geo_lng') is not None:
            dist = haversine_m(body.lat, body.lng, rank['geo_lat'], rank['geo_lng'])
            if dist > 20:
                raise HTTPException(status_code=400,
                                    detail="You are not within 20 metres of the rank. Please go to the rank to be able to join the queue.")
    if taxi.get('active_queue'):
        raise HTTPException(status_code=400, detail="Your taxi is already in the queue.")
    entry = {'id': str(uuid.uuid4()), 'taxi_registration': taxi['registration'],
             'rank_name': joining_rank, 'home_rank_name': taxi_home_rank,
             'driver_id': user['id'],
             'driver_name': user['full_name'], 'owner_name': taxi.get('owner_name'),
             'route': taxi['route'], 'seats': taxi['seats'],
             'fare_amount': taxi['fare_amount'], 'fare_label': taxi['fare_label'],
             'long_distance': taxi_is_long_distance,
             'status': 'waiting', 'joined_at': now_iso(), 'added_by': 'driver'}
    await db.queue.insert_one(entry)
    if taxi_is_long_distance:
        request_doc = {
            'id': str(uuid.uuid4()),
            'queue_id': entry['id'],
            'taxi_registration': taxi['registration'],
            'rank_name': joining_rank,
            'driver_name': user['full_name'],
            'route': taxi['route'],
            'seat_count': taxi['seats'],
            'passengers': [],
            'status': 'pending',
            'created_at': now_iso()
        }
        await db.long_distance_requests.insert_one(request_doc)
    await db.taxis.update_one({'id': taxi['id']}, {'$set': {'active_queue': True}})
    return {'ok': True}


@api.post("/driver/depart")
async def driver_depart(body: DepartIn, user=Depends(driver_dep)):
    taxi = await driver_taxi(user)
    entry = await db.queue.find_one({'taxi_registration': taxi['registration']}) if taxi else None
    if not entry:
        raise HTTPException(status_code=400, detail="Your taxi has no active queue entry.")
    long_pax = [p.dict() for p in (body.long_distance_passengers or []) if p.name.strip()]
    if not long_pax and entry.get('long_distance_passengers'):
        long_pax = entry.get('long_distance_passengers')
    if entry.get('long_distance') and not long_pax:
        raise HTTPException(status_code=400,
                            detail="Capture long-distance passenger details before departing.")
    revenue = entry['fare_amount'] * entry['seats']
    op = {'id': str(uuid.uuid4()), 'taxi_registration': entry['taxi_registration'],
          'rank_name': entry['rank_name'], 'owner_name': entry['owner_name'],
          'driver_name': entry['driver_name'], 'route': entry['route'],
          'seats': entry['seats'], 'fare_amount': entry['fare_amount'],
          'revenue': revenue, 'long_distance': entry.get('long_distance', False),
          'long_distance_passengers': long_pax, 'departed_at': now_iso()}
    await db.operations.insert_one(op)
    await db.queue.delete_one({'id': entry['id']})
    await db.taxis.update_one({'registration': taxi['registration']},
                              {'$set': {'active_queue': False}})
    await db.long_distance_requests.update_many(
        {'taxi_registration': taxi['registration'], 'status': 'pending'},
        {'$set': {'status': 'departed', 'passengers': long_pax, 'departed_at': now_iso()}}
    )
    return {'ok': True, 'revenue': revenue}


@api.post("/driver/sos")
async def driver_sos(user=Depends(driver_dep)):
    taxi = await driver_taxi(user)
    if not taxi:
        raise HTTPException(status_code=404, detail="No taxi assigned to you.")
    owner = await db.users.find_one({'role': 'owner', 'full_name': taxi['owner_name']})
    entry = await db.queue.find_one({'taxi_registration': taxi['registration']}, PROJ)
    
    # Retrieve passenger list from queue entry, or long_distance_requests, or latest operations
    long_pax = []
    if entry and entry.get('long_distance_passengers'):
        long_pax = entry.get('long_distance_passengers')
    if not long_pax:
        ldr = await db.long_distance_requests.find_one(
            {'taxi_registration': taxi['registration']},
            sort=[('created_at', -1)]
        )
        if ldr and ldr.get('passengers'):
            long_pax = ldr['passengers']
    if not long_pax:
        op = await db.operations.find_one(
            {'taxi_registration': taxi['registration']},
            sort=[('departed_at', -1)]
        )
        if op and op.get('long_distance_passengers'):
            long_pax = op['long_distance_passengers']

    sos_doc = {'id': str(uuid.uuid4()), 'driver_name': user['full_name'],
               'taxi_registration': taxi['registration'], 'rank_name': taxi['rank_name'],
               'owner_name': taxi['owner_name'], 'route': taxi['route'],
               'created_at': now_iso(), 'email_sent': False}
    email_sent = False
    if owner and owner.get('email'):
        from html import escape
        
        # Build clean, high-impact passenger table with next of kin
        if long_pax:
            pax_rows = ""
            for idx, p in enumerate(long_pax, 1):
                p_name = escape(p.get('name') or 'Passenger')
                p_kin = escape(p.get('kin_name') or p.get('next_of_kin') or '—')
                p_contact = escape(p.get('kin_contact') or p.get('contact') or '')
                p_dest = escape(p.get('destination') or '—')
                bg = "#f8fafc" if idx % 2 == 0 else "#ffffff"
                
                contact_cell = f"<a href='tel:{p_contact}' style='color:#dc2626;font-weight:bold;text-decoration:none;'>{p_contact}</a>" if p_contact else "—"
                
                pax_rows += (
                    f"<tr style='background-color:{bg};border-bottom:1px solid #e2e8f0;'>"
                    f"<td style='padding:8px 10px;text-align:center;font-weight:bold;color:#64748b;font-size:12px;'>{idx}</td>"
                    f"<td style='padding:8px 10px;font-weight:bold;color:#0f172a;font-size:13px;'>{p_name}</td>"
                    f"<td style='padding:8px 10px;color:#334155;font-size:13px;'>{p_kin}</td>"
                    f"<td style='padding:8px 10px;font-size:13px;'>{contact_cell}</td>"
                    f"<td style='padding:8px 10px;color:#64748b;font-size:12px;'>{p_dest}</td>"
                    f"</tr>"
                )
            pax_table = (
                f"<div style='margin-top:20px;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;'>"
                f"<div style='background-color:#0f172a;padding:10px 14px;'>"
                f"<span style='color:#f8fafc;font-weight:bold;font-size:13px;text-transform:uppercase;'>📋 Passenger Manifest & Next-of-Kin Emergency Contacts ({len(long_pax)})</span>"
                f"</div>"
                f"<table style='width:100%;border-collapse:collapse;text-align:left;font-family:Arial,sans-serif;'>"
                f"<thead>"
                f"<tr style='background-color:#f1f5f9;color:#475569;font-size:11px;text-transform:uppercase;border-bottom:2px solid #cbd5e1;'>"
                f"<th style='padding:8px 10px;text-align:center;'>#</th>"
                f"<th style='padding:8px 10px;'>Passenger</th>"
                f"<th style='padding:8px 10px;'>Next of Kin</th>"
                f"<th style='padding:8px 10px;'>Emergency Phone</th>"
                f"<th style='padding:8px 10px;'>Destination</th>"
                f"</tr>"
                f"</thead>"
                f"<tbody>{pax_rows}</tbody>"
                f"</table>"
                f"</div>"
            )
        else:
            pax_table = (
                "<div style='margin-top:16px;padding:12px 14px;background-color:#f8fafc;border:1px dashed #cbd5e1;border-radius:6px;color:#64748b;font-size:12px;'>"
                "ℹ️ No passenger manifest recorded for this trip."
                "</div>"
            )

        driver_cell = escape(user.get('cell_phone') or '')
        driver_cell_link = f"<a href='tel:{driver_cell}' style='color:#38bdf8;text-decoration:none;font-weight:bold;'>{driver_cell}</a>" if driver_cell else "—"

        html = (
            f"<table role='presentation' width='100%' style='background-color:#f8fafc;padding:20px;font-family:Arial,sans-serif;'>"
            f"<tr><td align='center'>"
            f"<table role='presentation' width='600' style='background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);'>"
            f"<tr><td style='background-color:#b91c1c;padding:18px 24px;color:#ffffff;'>"
            f"<div style='font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#fecaca;'>EMERGENCY DISTRESS SIGNAL</div>"
            f"<h1 style='margin:6px 0 0 0;font-size:22px;color:#ffffff;font-weight:bold;'>SOS ALERT FROM DRIVER</h1>"
            f"</td></tr>"
            f"<tr><td style='padding:24px;'>"
            f"<table role='presentation' width='100%' style='background-color:#0f172a;border-radius:8px;padding:14px;color:#ffffff;font-size:13px;'>"
            f"<tr><td style='color:#94a3b8;padding:4px 8px;width:32%;'>Driver:</td><td style='padding:4px 8px;font-weight:bold;color:#ffffff;'>{escape(user['full_name'])}</td></tr>"
            f"<tr><td style='color:#94a3b8;padding:4px 8px;'>Driver Contact:</td><td style='padding:4px 8px;'>{driver_cell_link}</td></tr>"
            f"<tr><td style='color:#94a3b8;padding:4px 8px;'>Taxi Reg:</td><td style='padding:4px 8px;font-weight:bold;font-size:15px;color:#ffffff;letter-spacing:0.5px;'>{escape(taxi['registration'])}</td></tr>"
            f"<tr><td style='color:#94a3b8;padding:4px 8px;'>Rank:</td><td style='padding:4px 8px;color:#ffffff;'>{escape(taxi['rank_name'])}</td></tr>"
            f"<tr><td style='color:#94a3b8;padding:4px 8px;'>Route:</td><td style='padding:4px 8px;color:#ffffff;'>{escape(taxi['route'])}</td></tr>"
            f"<tr><td style='color:#94a3b8;padding:4px 8px;'>Triggered At:</td><td style='padding:4px 8px;color:#fbbf24;font-family:monospace;'>{escape(sos_doc['created_at'])}</td></tr>"
            f"</table>"
            f"{pax_table}"
            f"<div style='margin-top:20px;padding:12px;background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;font-size:12px;color:#991b1b;'>"
            f"<strong>Emergency Action:</strong> Contact driver immediately. If unable to reach driver, contact the next-of-kin contacts listed above and inform emergency services."
            f"</div>"
            f"<p style='margin-top:20px;font-size:11px;color:#94a3b8;text-align:center;'>Sent automatically by E-RANK Operations. We never ask for passwords or sensitive payment info by email.</p>"
            f"</td></tr></table>"
            f"</td></tr></table>"
        )
        try:
            await send_email(to=owner['email'], subject=f"E-RANK SOS \u2013 {taxi['registration']}",
                             html=html)
            email_sent = True
        except Exception as e:
            logger.error(f"SOS email failed: {e}")
    sos_doc['email_sent'] = email_sent
    await db.sos_events.insert_one(sos_doc)
    return {'ok': True, 'email_sent': email_sent,
            'owner_notified': owner['full_name'] if owner else None}


# ---------------- passenger ----------------
passenger_dep = require_role('passenger')


@api.get("/passenger/lookup")
async def passenger_lookup(registration: str, user=Depends(passenger_dep)):
    return await public_taxi(registration)


@api.post("/passenger/location")
async def passenger_update_location(body: UpdateLocationIn, user=Depends(passenger_dep)):
    lat = body.lat
    lng = body.lng
    now = now_iso()
    await db.passenger_locations.update_one(
        {'user_id': user['id']},
        {'$set': {'user_id': user['id'], 'user_name': user.get('full_name'), 'lat': lat, 'lng': lng, 'updated_at': now}},
        upsert=True
    )
    # Also link to taxi if passenger recently looked up or shared
    return {'ok': True, 'lat': lat, 'lng': lng, 'updated_at': now}


@api.post("/public/taxi/{registration}/live-location")
async def taxi_update_live_location(registration: str, body: UpdateLocationIn):
    reg = registration.strip()
    lat = body.lat if body.lat is not None else body.latitude
    lng = body.lng if body.lng is not None else body.longitude
    now = now_iso()
    await db.live_passenger_locations.update_one(
        {'registration': {'$regex': f'^{reg}$', '$options': 'i'}},
        {'$set': {'registration': reg, 'lat': lat, 'lng': lng, 'passenger_name': body.passenger_name or 'Passenger', 'updated_at': now}},
        upsert=True
    )
    return {'ok': True, 'lat': lat, 'lng': lng, 'updated_at': now}


@api.post("/public/taxi/{registration}/live-location")
async def taxi_update_live_location(registration: str, body: UpdateLocationIn):
    reg = registration.strip()
    lat = body.lat if body.lat is not None else body.latitude
    lng = body.lng if body.lng is not None else body.longitude
    now = now_iso()
    clean_key = re.sub(r'\s+', '', reg).upper()
    await db.live_passenger_locations.update_one(
        {'$or': [
            {'reg_key': clean_key},
            {'registration': {'$regex': f'^{re.escape(reg)}$', '$options': 'i'}},
            {'registration': {'$regex': re.sub(r'\s+', r'\\s*', re.escape(reg)), '$options': 'i'}}
        ]},
        {'$set': {
            'registration': reg,
            'reg_key': clean_key,
            'lat': lat,
            'lng': lng,
            'passenger_name': body.passenger_name or 'Passenger',
            'updated_at': now
        }},
        upsert=True
    )
    return {'ok': True, 'lat': lat, 'lng': lng, 'updated_at': now}


@api.get("/public/taxi/{registration}/live-location")
async def taxi_get_live_location(registration: str):
    reg = registration.strip()
    clean_key = re.sub(r'\s+', '', reg).upper()
    loc = await db.live_passenger_locations.find_one(
        {'$or': [
            {'reg_key': clean_key},
            {'registration': {'$regex': f'^{re.escape(reg)}$', '$options': 'i'}},
            {'registration': {'$regex': re.sub(r'\s+', r'\\s*', re.escape(reg)), '$options': 'i'}}
        ]},
        PROJ
    )
    if not loc or loc.get('lat') is None or loc.get('lng') is None:
        return {'active': False, 'has_location': False, 'lat': None, 'lng': None}
    lat = loc.get('lat')
    lng = loc.get('lng')
    return {
        'active': True,
        'has_location': True,
        'lat': lat,
        'lng': lng,
        'latitude': lat,
        'longitude': lng,
        'passenger_name': loc.get('passenger_name', 'Passenger'),
        'updated_at': loc.get('updated_at'),
        'google_maps_url': f"https://www.google.com/maps?q={lat},{lng}",
        'google_directions_url': f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}"
    }


# ---------------- AI Assistant (Unscripted & Real AI) ----------------
@api.post("/public/ai/assistant")
async def ai_assistant(body: AskAiIn):
    query = (body.message or "").strip()
    lang = body.language or "English"
    user_name = (body.user_name or "").strip()

    if not query:
        greeting = f"Hello {user_name}!" if user_name else "Hello!"
        return {
            'reply': f"{greeting} How can I help you with taxi ranks, routes, fares or safe travel today?",
            'language': lang
        }

    # Fetch live database records to ground the real AI in factual platform data
    ranks = await db.ranks.find({}, {'_id': 0, 'rank_name': 1, 'location': 1}).to_list(100)
    routes = await db.routes.find({}, {'_id': 0, 'rank_name': 1, 'route': 1, 'fare_label': 1}).to_list(200)

    ranks_summary = ", ".join([f"{r['rank_name']} in {r.get('location', '')}" for r in ranks])
    routes_summary = "; ".join([f"{r['route']} ({r['rank_name']} -> {r.get('fare_label', '')})" for r in routes[:35]])

    system_prompt = (
        f"You are the intelligent, unscripted AI Assistant for E-RANK, a South African minibus taxi platform. "
        f"User name: {user_name if user_name else 'User'}. "
        f"Answer in: {lang}. "
        f"Real in-app database data:\n"
        f"Ranks on E-RANK: {ranks_summary}\n"
        f"Routes and Fares: {routes_summary}\n\n"
        f"User message: {query}\n\n"
        f"Guidelines:\n"
        f"- Answer naturally like a real AI. Do not repeat robotic scripts.\n"
        f"- Answer to your best general knowledge about South Africa, taxi routes, travel, and fares.\n"
        f"- If the city or rank is on E-RANK, quote the actual fare/location.\n"
        f"- If the user asks about other cities or towns (like Durban, Cape Town, etc.), share your knowledge helpfully and mention that those ranks are not yet registered on E-RANK.\n"
        f"- Do NOT tell the user 'please speak to a marshal' unless they specifically ask who is in charge on site.\n"
        f"- Keep the answer concise (2-4 sentences), friendly, and practical in {lang}."
    )

    import urllib.request
    from urllib.parse import quote_plus
    try:
        url = f"https://text.pollinations.ai/{quote_plus(system_prompt)}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode('utf-8', errors='ignore')
            clean = raw.split('---')[0].strip()
            if clean:
                return {'reply': clean, 'language': lang}
    except Exception as e:
        logger.warning(f"Live AI completion notice: {e}")

    # Natural fallback if external connection is slow
    q_lower = query.lower()
    matched_routes = [r for r in routes if any(w in r['route'].lower() for w in q_lower.split() if len(w) > 3)]
    matched_ranks = [r for r in ranks if r['rank_name'].lower() in q_lower or r.get('location', '').lower() in q_lower]

    if matched_routes:
        rt = matched_routes[0]
        return {
            'reply': f"For {rt['route']}, taxis depart from {rt['rank_name']} with an official fare of {rt.get('fare_label', 'N/A')}.",
            'language': lang
        }
    elif matched_ranks:
        rk = matched_ranks[0]
        return {
            'reply': f"{rk['rank_name']} is located in {rk.get('location', 'South Africa')}. You can find verified operating taxis and fares for this rank on E-RANK.",
            'language': lang
        }

    return {
        'reply': f"I understand you're asking about '{query}'. While our live system currently covers verified ranks across Johannesburg and Kimberley, I can help you with fares, routes, or safe ride tracking across the platform.",
        'language': lang
    }


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await seed_module.seed()
    logger.info("E-RANK seed complete")


@app.on_event("shutdown")
async def on_shutdown():
    from core import client
    client.close()


# Mount frontend static build for single-app cloud deployments
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

frontend_build_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "build")
if os.path.exists(frontend_build_dir):
    static_assets = os.path.join(frontend_build_dir, "static")
    if os.path.exists(static_assets):
        app.mount("/static", StaticFiles(directory=static_assets), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_build_dir, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_build_dir, "index.html"))
