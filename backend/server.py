import io
import uuid
import base64
import logging
import math
from typing import Optional, List

import qrcode
from openpyxl import Workbook
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
    contact: str
    destination: str


class DepartIn(BaseModel):
    long_distance_passengers: Optional[List[LongPassenger]] = None


class MarshalDepartIn(BaseModel):
    registration: str
    long_distance_passengers: Optional[List[LongPassenger]] = None


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


@api.get("/public/search")
async def public_search(q: str = ""):
    q = q.strip()
    if not q:
        return {'ranks': [], 'routes': [], 'taxis': []}
    rx = {'$regex': q, '$options': 'i'}
    ranks = await db.ranks.find({'$or': [{'rank_name': rx}, {'location': rx}]},
                                {'_id': 0, 'qr_token': 0}).to_list(50)
    routes = await db.routes.find({'$or': [{'route': rx}, {'rank_name': rx}]}, PROJ).to_list(50)
    taxis = await db.taxis.find({'$or': [{'registration': rx}, {'route': rx}, {'rank_name': rx}]},
                                {'_id': 0, 'registration': 1, 'rank_name': 1, 'route': 1,
                                 'fare_label': 1}).to_list(50)
    return {'ranks': ranks, 'routes': routes, 'taxis': taxis}


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
    t['share_url'] = f"{APP_BASE_URL}/t/{t['registration'].replace(' ', '%20')}"
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
    ops = await db.operations.find({'owner_name': user['full_name']}, PROJ).sort('departed_at', -1).to_list(10000)
    wb = Workbook()
    ws = wb.active
    ws.title = "Revenue"
    ws.append(["Date", "Taxi", "Rank", "Route", "Seats", "Fare (R)", "Revenue (R)", "Long Distance"])
    for o in ops:
        ws.append([o.get('departed_at', ''), o.get('taxi_registration', ''),
                   o.get('rank_name', ''), o.get('route', ''), o.get('seats', 0),
                   o.get('fare_amount', 0), o.get('revenue', 0),
                   "Yes" if o.get('long_distance') else "No"])
    ws.append([])
    ws.append(["", "", "", "", "", "TOTAL", sum(o.get('revenue', 0) for o in ops)])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    fn = f"erank_revenue_{user['full_name'].replace(' ', '_')}.xlsx"
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
    await db.taxis.update_one({'id': taxi['id']}, {'$set': {'active_queue': True}})
    return {'ok': True}


@api.post("/marshal/queue/depart")
async def marshal_queue_depart(body: MarshalDepartIn, user=Depends(marshal_dep)):
    reg = body.registration.strip()
    entry = await db.queue.find_one({'taxi_registration': {'$regex': f'^{reg}$', '$options': 'i'},
                                     'rank_name': user['rank_name']})
    if not entry:
        raise HTTPException(status_code=400, detail="That taxi is not in your queue.")
    long_pax = [p.dict() for p in (body.long_distance_passengers or [])]
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
    return {'ok': True, 'revenue': revenue}


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
    }


@api.post("/driver/join")
async def driver_join(body: JoinIn, user=Depends(driver_dep)):
    rank = await rank_by_token(body.token)
    if not rank:
        raise HTTPException(status_code=400, detail="This QR code is not valid.")
    taxi = await driver_taxi(user)
    if not taxi:
        raise HTTPException(status_code=404, detail="No taxi assigned to you.")
    if rank['rank_name'] != taxi['rank_name']:
        raise HTTPException(status_code=400,
                            detail=f"Wrong rank. You are assigned to {taxi['rank_name']}.")
    if rank.get('geo_check_enabled'):
        if body.lat is None or body.lng is None:
            raise HTTPException(status_code=400, detail="Location is required to join this rank.")
        if rank.get('geo_lat') is not None and rank.get('geo_lng') is not None:
            dist = haversine_m(body.lat, body.lng, rank['geo_lat'], rank['geo_lng'])
            if dist > 20:
                raise HTTPException(status_code=400,
                                    detail=f"You are {int(dist)}m away. Move within 20m of the rank to join.")
    if taxi.get('active_queue'):
        raise HTTPException(status_code=400, detail="Your taxi is already in the queue.")
    entry = {'id': str(uuid.uuid4()), 'taxi_registration': taxi['registration'],
             'rank_name': taxi['rank_name'], 'driver_id': user['id'],
             'driver_name': user['full_name'], 'owner_name': taxi.get('owner_name'),
             'route': taxi['route'], 'seats': taxi['seats'],
             'fare_amount': taxi['fare_amount'], 'fare_label': taxi['fare_label'],
             'long_distance': is_long_distance(taxi['route']),
             'status': 'waiting', 'joined_at': now_iso(), 'added_by': 'driver'}
    await db.queue.insert_one(entry)
    await db.taxis.update_one({'id': taxi['id']}, {'$set': {'active_queue': True}})
    return {'ok': True}


@api.post("/driver/depart")
async def driver_depart(body: DepartIn, user=Depends(driver_dep)):
    taxi = await driver_taxi(user)
    entry = await db.queue.find_one({'taxi_registration': taxi['registration']}) if taxi else None
    if not entry:
        raise HTTPException(status_code=400, detail="Your taxi has no active queue entry.")
    long_pax = [p.dict() for p in (body.long_distance_passengers or [])]
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
    return {'ok': True, 'revenue': revenue}


@api.post("/driver/sos")
async def driver_sos(user=Depends(driver_dep)):
    taxi = await driver_taxi(user)
    if not taxi:
        raise HTTPException(status_code=404, detail="No taxi assigned to you.")
    owner = await db.users.find_one({'role': 'owner', 'full_name': taxi['owner_name']})
    entry = await db.queue.find_one({'taxi_registration': taxi['registration']}, PROJ)
    long_pax = entry.get('long_distance_passengers', []) if entry else []
    sos_doc = {'id': str(uuid.uuid4()), 'driver_name': user['full_name'],
               'taxi_registration': taxi['registration'], 'rank_name': taxi['rank_name'],
               'owner_name': taxi['owner_name'], 'route': taxi['route'],
               'created_at': now_iso(), 'email_sent': False}
    email_sent = False
    if owner and owner.get('email'):
        from html import escape
        rows = "".join(
            f"<tr><td style='padding:4px 8px'>{escape(p.get('name',''))}</td>"
            f"<td style='padding:4px 8px'>{escape(p.get('contact',''))}</td>"
            f"<td style='padding:4px 8px'>{escape(p.get('destination',''))}</td></tr>"
            for p in long_pax)
        pax_block = (f"<h3>Long-distance passengers</h3><table>{rows}</table>" if rows else "")
        html = (
            f"<table role='presentation' width='100%'><tr><td style='padding:24px;"
            f"font-family:Arial,sans-serif;color:#111'>"
            f"<h2 style='color:#b91c1c'>SOS ALERT from your driver</h2>"
            f"<p>Driver <strong>{escape(user['full_name'])}</strong> has triggered an SOS.</p>"
            f"<p>Taxi: <strong>{escape(taxi['registration'])}</strong><br>"
            f"Rank: {escape(taxi['rank_name'])}<br>Route: {escape(taxi['route'])}<br>"
            f"Driver contact: {escape(user.get('cell_phone',''))}<br>"
            f"Time: {escape(sos_doc['created_at'])}</p>"
            f"{pax_block}"
            f"<p style='font-size:12px;color:#888'>Sent by E-RANK. We never ask for your "
            f"password or card details by email.</p></td></tr></table>")
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
