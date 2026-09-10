"""
E-RANK backend integration tests.
Covers auth, public endpoints, admin/owner/marshal/driver/passenger flows.
IMPORTANT: These tests permanently update seeded PINs. Recorded new PINs below.
"""
import io
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://taxi-rank-ops-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

# New credentials set during this test run (must_change flow)
NEW_ADMIN_PW = "newErank2026!"       # siya@erank.co.za
NEW_OWNER_PIN = "990099"             # Mzamo Vilakazi
NEW_MARSHAL_PIN = "900900900"        # Muzi Sogoni
NEW_DRIVER_PIN = "80088008"          # Sizwe Dlomo & Owen Mathe

TOKENS = {}  # role -> token


def _login(role, identifier, secret):
    r = requests.post(f"{API}/auth/login",
                      json={"role": role, "identifier": identifier, "secret": secret},
                      timeout=15)
    return r


def _login_any(role, identifier, secrets):
    """Try multiple secrets — supports idempotent re-runs after PIN change."""
    last = None
    for s in secrets:
        r = _login(role, identifier, s)
        if r.status_code == 200:
            return r, s
        last = r
    return last, None


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Public ----------------
class TestPublic:
    def test_ranks(self):
        r = requests.get(f"{API}/public/ranks", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 5
        for rank in data:
            assert 'qr_token' not in rank  # never leak QR token
            assert 'rank_name' in rank

    def test_routes(self):
        r = requests.get(f"{API}/public/routes", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) > 0
        assert 'taxis' in data[0] and 'fare_label' in data[0]

    def test_updates(self):
        r = requests.get(f"{API}/public/updates", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_search(self):
        r = requests.get(f"{API}/public/search", params={"q": "MTN"}, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert 'ranks' in d and 'routes' in d and 'taxis' in d

    def test_public_taxi_safe(self):
        r = requests.get(f"{API}/public/taxi/MT 004 GP", timeout=10)
        assert r.status_code == 200
        t = r.json()
        assert t['registration'].upper() == "MT 004 GP"
        assert t['verified'] is True
        assert 'share_url' in t
        # must NOT include driver info
        for forbidden in ('driver_name', 'driver_cell', 'cell_phone', 'driver_id'):
            assert forbidden not in t, f"public taxi leaked {forbidden}"

    def test_public_taxi_not_found(self):
        r = requests.get(f"{API}/public/taxi/ZZZ 999 ZZ", timeout=10)
        assert r.status_code == 404


# ---------------- Auth: login + first-login change ----------------
class TestAuthAndChange:
    def test_login_wrong_secret(self):
        r = _login("admin", "siya@erank.co.za", "WRONGPW")
        assert r.status_code == 401
        assert "detail" in r.json()

    def test_admin_login_and_change(self):
        r, used = _login_any("admin", "siya@erank.co.za", ["erank2026", NEW_ADMIN_PW])
        assert r.status_code == 200, r.text
        data = r.json()
        token = data['token']
        assert data['user']['role'] == 'admin'
        # change password (idempotent to new value)
        cr = requests.post(f"{API}/auth/change-secret",
                          json={"new_secret": NEW_ADMIN_PW}, headers=_auth(token), timeout=10)
        assert cr.status_code == 200
        # login with new
        r2 = _login("admin", "siya@erank.co.za", NEW_ADMIN_PW)
        assert r2.status_code == 200
        assert r2.json()['user']['must_change'] is False
        TOKENS['admin'] = r2.json()['token']

    def test_owner_login_and_change(self):
        r, _ = _login_any("owner", "Mzamo Vilakazi", ["123456", NEW_OWNER_PIN])
        assert r.status_code == 200, r.text
        token = r.json()['token']
        cr = requests.post(f"{API}/auth/change-secret",
                          json={"new_secret": NEW_OWNER_PIN}, headers=_auth(token), timeout=10)
        assert cr.status_code == 200
        r2 = _login("owner", "Mzamo Vilakazi", NEW_OWNER_PIN)
        assert r2.status_code == 200
        u = r2.json()['user']
        assert u['must_change'] is False
        assert u['rank_name'] == "MTN Rank"
        TOKENS['owner'] = r2.json()['token']

    def test_marshal_login_and_change(self):
        r, _ = _login_any("marshal", "Muzi Sogoni", ["123456789", NEW_MARSHAL_PIN])
        assert r.status_code == 200, r.text
        token = r.json()['token']
        cr = requests.post(f"{API}/auth/change-secret",
                          json={"new_secret": NEW_MARSHAL_PIN}, headers=_auth(token), timeout=10)
        assert cr.status_code == 200
        r2 = _login("marshal", "Muzi Sogoni", NEW_MARSHAL_PIN)
        assert r2.status_code == 200
        TOKENS['marshal'] = r2.json()['token']

    def test_driver_login_and_change(self):
        r, _ = _login_any("driver", "Sizwe Dlomo", ["12345678", NEW_DRIVER_PIN])
        assert r.status_code == 200, r.text
        token = r.json()['token']
        cr = requests.post(f"{API}/auth/change-secret",
                          json={"new_secret": NEW_DRIVER_PIN}, headers=_auth(token), timeout=10)
        assert cr.status_code == 200
        r2 = _login("driver", "Sizwe Dlomo", NEW_DRIVER_PIN)
        assert r2.status_code == 200
        TOKENS['driver'] = r2.json()['token']

    def test_long_driver_change(self):
        r, _ = _login_any("driver", "Owen Mathe", ["12345678", NEW_DRIVER_PIN])
        assert r.status_code == 200, r.text
        cr = requests.post(f"{API}/auth/change-secret",
                          json={"new_secret": NEW_DRIVER_PIN},
                          headers=_auth(r.json()['token']), timeout=10)
        assert cr.status_code == 200
        r2 = _login("driver", "Owen Mathe", NEW_DRIVER_PIN)
        assert r2.status_code == 200
        TOKENS['driver_long'] = r2.json()['token']

    def test_passenger_login(self):
        r = _login("passenger", "Lizwi Lakhe", "246810")
        assert r.status_code == 200, r.text
        u = r.json()['user']
        assert u['must_change'] is False
        TOKENS['passenger'] = r.json()['token']


# ---------------- Passenger self-register ----------------
class TestRegister:
    def test_passenger_register_phone_normalized(self):
        import uuid as _u
        name = f"TEST User {_u.uuid4().hex[:6]}"
        r = requests.post(f"{API}/auth/register", json={
            "full_name": name,
            "contact_number": "0821234567",
            "email": f"test_{_u.uuid4().hex[:6]}@example.com",
            "pin": "112233",
        }, timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data['user']['cell_phone'].startswith("+27")
        assert data['user']['cell_phone'] == "+27821234567"
        assert data['user']['role'] == 'passenger'


# ---------------- Profile edits ----------------
class TestProfile:
    def test_owner_edit_email_and_phone(self):
        r = requests.put(f"{API}/profile",
                        json={"email": "newmzamo@example.com", "contact_number": "0712233445"},
                        headers=_auth(TOKENS['owner']), timeout=10)
        assert r.status_code == 200
        u = r.json()
        assert u['email'] == "newmzamo@example.com"
        assert u['cell_phone'] == "+27712233445"

    def test_marshal_email_ignored(self):
        # marshal has no email; setting one should not persist
        r = requests.put(f"{API}/profile",
                        json={"email": "muzi@example.com", "contact_number": "0790000000"},
                        headers=_auth(TOKENS['marshal']), timeout=10)
        assert r.status_code == 200
        u = r.json()
        assert u.get('email') is None or u.get('email') != "muzi@example.com"
        assert u['cell_phone'] == "+27790000000"

    def test_driver_email_ignored(self):
        r = requests.put(f"{API}/profile",
                        json={"email": "driver@example.com", "contact_number": "0810000001"},
                        headers=_auth(TOKENS['driver']), timeout=10)
        assert r.status_code == 200
        u = r.json()
        assert u.get('email') is None or u.get('email') != "driver@example.com"
        assert u['cell_phone'] == "+27810000001"


# ---------------- Marshal flows ----------------
class TestMarshal:
    def test_scoped_queries(self):
        h = _auth(TOKENS['marshal'])
        rr = requests.get(f"{API}/marshal/rank", headers=h, timeout=10).json()
        assert rr['rank_name'] == "MTN Rank"
        taxis = requests.get(f"{API}/marshal/taxis", headers=h, timeout=10).json()
        assert all(t['rank_name'] == "MTN Rank" for t in taxis)
        routes = requests.get(f"{API}/marshal/routes", headers=h, timeout=10).json()
        assert all(r['rank_name'] == "MTN Rank" for r in routes)

    def test_qr_and_regenerate(self):
        h = _auth(TOKENS['marshal'])
        qr = requests.get(f"{API}/marshal/qr", headers=h, timeout=10).json()
        assert 'token' in qr and qr['image'].startswith('data:image/png;base64,')
        old = qr['token']
        new = requests.post(f"{API}/marshal/qr/regenerate", headers=h, timeout=10).json()
        assert new['token'] != old
        # save token for driver join test
        TOKENS['mtn_qr'] = new['token']

    def test_geo_toggle(self):
        h = _auth(TOKENS['marshal'])
        r = requests.post(f"{API}/marshal/geo-check", json={"enabled": False}, headers=h, timeout=10)
        assert r.status_code == 200 and r.json()['geo_check_enabled'] is False

    def test_wrong_rank_add(self):
        h = _auth(TOKENS['marshal'])
        r = requests.post(f"{API}/marshal/queue/add",
                        json={"registration": "IN 121 NC"}, headers=h, timeout=10)
        assert r.status_code == 400
        assert "your rank" in r.json()['detail'].lower()

    def test_fare_update(self):
        h = _auth(TOKENS['marshal'])
        r = requests.post(f"{API}/marshal/fare",
                        json={"route": "Local", "fare": "R27"}, headers=h, timeout=10)
        assert r.status_code == 200
        routes = requests.get(f"{API}/marshal/routes", headers=h, timeout=10).json()
        local = next(x for x in routes if x['route'] == "Local")
        assert local['fare_amount'] == 27
        # restore
        requests.post(f"{API}/marshal/fare", json={"route": "Local", "fare": "R26"}, headers=h)

    def test_updates_crud(self):
        h = _auth(TOKENS['marshal'])
        r = requests.post(f"{API}/marshal/updates",
                        json={"title": "TEST update", "message": "hello", "status": "Active"},
                        headers=h, timeout=10)
        assert r.status_code == 200
        uid = r.json()['id']
        lst = requests.get(f"{API}/marshal/updates", headers=h, timeout=10).json()
        assert any(u['id'] == uid for u in lst)
        d = requests.delete(f"{API}/marshal/updates/{uid}", headers=h, timeout=10)
        assert d.status_code == 200


# ---------------- Driver flows ----------------
class TestDriver:
    def test_status(self):
        h = _auth(TOKENS['driver'])
        r = requests.get(f"{API}/driver/status", headers=h, timeout=10)
        assert r.status_code == 200
        s = r.json()
        assert s['assigned_rank'] == "MTN Rank"
        assert s['long_distance'] is False
        assert s['taxi']['registration'] == "MT 004 GP"

    def test_depart_without_queue(self):
        h = _auth(TOKENS['driver'])
        r = requests.post(f"{API}/driver/depart", json={}, headers=h, timeout=10)
        assert r.status_code == 400

    def test_wrong_qr_join(self):
        h = _auth(TOKENS['driver'])
        # Get a different rank's QR token via admin (Indian Center)
        # Simplest: use invalid token
        r = requests.post(f"{API}/driver/join", json={"token": "not-a-real-token"},
                        headers=h, timeout=10)
        assert r.status_code == 400
        assert "not valid" in r.json()['detail'].lower()

    def test_wrong_rank_qr(self):
        # Login as Indian Center marshal to fetch their QR, then try join as Sizwe Dlomo (MTN)
        # But we don't want to change Lesedi's PIN. Use admin to fetch rank via public data? No qr in public.
        # Instead: we can create a rank via admin, get its qr_token from server directly.
        # Easiest: use admin to list ranks -- but qr_token filtered. Use admin/queue no. 
        # Alternative: create new rank via admin and use its qr_token from response
        h_admin = _auth(TOKENS['admin'])
        # We must fetch the qr token. Admin doesn't expose ranks. Use a marshal QR from another rank.
        # We'll temporarily change Lesedi Morata's PIN? Would break later. Skip complex approach:
        # Directly: use the ADMIN to create a NEW temp rank, but its qr_token is returned only via marshal (which we don't have).
        # Best: change Lesedi's PIN and record it.
        r_l = _login("marshal", "Lesedi Morata", "123456789")
        if r_l.status_code == 200:
            t = r_l.json()['token']
            requests.post(f"{API}/auth/change-secret", json={"new_secret": "900900900"},
                         headers=_auth(t), timeout=10)
            r_l2 = _login("marshal", "Lesedi Morata", "900900900")
            tok2 = r_l2.json()['token']
        else:
            # already changed in a prior run
            r_l2 = _login("marshal", "Lesedi Morata", "900900900")
            tok2 = r_l2.json()['token']
        qr = requests.get(f"{API}/marshal/qr", headers=_auth(tok2), timeout=10).json()
        wrong_token = qr['token']
        r = requests.post(f"{API}/driver/join", json={"token": wrong_token},
                        headers=_auth(TOKENS['driver']), timeout=10)
        assert r.status_code == 400
        assert "wrong rank" in r.json()['detail'].lower()

    def test_join_correct_and_double(self):
        h = _auth(TOKENS['driver'])
        # ensure geo off (from marshal test)
        r = requests.post(f"{API}/driver/join",
                        json={"token": TOKENS['mtn_qr']}, headers=h, timeout=10)
        assert r.status_code == 200, r.text
        # duplicate
        r2 = requests.post(f"{API}/driver/join",
                          json={"token": TOKENS['mtn_qr']}, headers=h, timeout=10)
        assert r2.status_code == 400
        assert "already" in r2.json()['detail'].lower()

    def test_owner_replace_driver_blocked_while_queued(self):
        h = _auth(TOKENS['owner'])
        r = requests.put(f"{API}/owner/taxis/MT 004 GP/driver",
                        json={"driver_name": "TEST Replace",
                              "driver_cell": "0821111111", "driver_pin": "12345678"},
                        headers=h, timeout=10)
        assert r.status_code == 400

    def test_depart_local_success(self):
        h = _auth(TOKENS['driver'])
        r = requests.post(f"{API}/driver/depart", json={}, headers=h, timeout=10)
        assert r.status_code == 200, r.text
        # revenue = 15 seats * fare (26)
        data = r.json()
        assert data['revenue'] == 15 * 26
        # queue cleared
        s = requests.get(f"{API}/driver/status", headers=h, timeout=10).json()
        assert s['in_queue'] is False

    def test_long_distance_depart_requires_passengers(self):
        # marshal add Owen Mathe's taxi in Indian Center: use Lesedi
        r_l = _login("marshal", "Lesedi Morata", "900900900")
        assert r_l.status_code == 200
        mh = _auth(r_l.json()['token'])
        requests.post(f"{API}/marshal/geo-check", json={"enabled": False}, headers=mh, timeout=10)
        add = requests.post(f"{API}/marshal/queue/add",
                          json={"registration": "IN 123 NC"}, headers=mh, timeout=10)
        assert add.status_code == 200 or "already" in add.text.lower()
        # depart without passengers
        dh = _auth(TOKENS['driver_long'])
        r = requests.post(f"{API}/driver/depart", json={}, headers=dh, timeout=10)
        assert r.status_code == 400
        # with passengers
        r2 = requests.post(f"{API}/driver/depart", json={
            "long_distance_passengers": [{"name": "P1", "contact": "0821111111",
                                         "destination": "JHB"}]
        }, headers=dh, timeout=10)
        assert r2.status_code == 200, r2.text

    def test_sos(self):
        h = _auth(TOKENS['driver'])
        r = requests.post(f"{API}/driver/sos", json={}, headers=h, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d['owner_notified'] == "Mzamo Vilakazi"
        # email_sent may be true/false depending on Resend; just verify key present
        assert 'email_sent' in d


# ---------------- Owner: revenue, taxis, export ----------------
class TestOwner:
    def test_owner_taxis_and_drivers_scoped(self):
        h = _auth(TOKENS['owner'])
        taxis = requests.get(f"{API}/owner/taxis", headers=h, timeout=10).json()
        assert all(t['owner_name'] == "Mzamo Vilakazi" for t in taxis)
        drivers = requests.get(f"{API}/owner/drivers", headers=h, timeout=10).json()
        assert all(d['owner_name'] == "Mzamo Vilakazi" for d in drivers)

    def test_owner_revenue(self):
        h = _auth(TOKENS['owner'])
        r = requests.get(f"{API}/owner/revenue", headers=h, timeout=10)
        assert r.status_code == 200
        rev = r.json()
        assert rev['total_revenue'] >= 15 * 26  # from depart test
        assert rev['total_trips'] >= 1

    def test_revenue_export_xlsx(self):
        h = _auth(TOKENS['owner'])
        r = requests.get(f"{API}/owner/revenue/export", headers=h, timeout=15)
        assert r.status_code == 200
        assert "spreadsheetml" in r.headers.get("content-type", "")
        # PK header of xlsx
        assert r.content[:2] == b"PK"


# ---------------- Admin ----------------
class TestAdmin:
    def test_overview(self):
        r = requests.get(f"{API}/admin/overview", headers=_auth(TOKENS['admin']), timeout=10)
        assert r.status_code == 200
        d = r.json()
        for k in ('owners', 'marshals', 'drivers', 'taxis', 'ranks', 'routes'):
            assert d[k] > 0

    def test_users_by_role(self):
        for role in ('owner', 'marshal', 'driver', 'admin', 'passenger'):
            r = requests.get(f"{API}/admin/users/{role}", headers=_auth(TOKENS['admin']), timeout=10)
            assert r.status_code == 200
            for u in r.json():
                assert 'secret_hash' not in u

    def test_delete_driver_blocked(self):
        # find a driver id
        drivers = requests.get(f"{API}/admin/users/driver",
                              headers=_auth(TOKENS['admin']), timeout=10).json()
        did = drivers[0]['id']
        r = requests.delete(f"{API}/admin/users/{did}",
                          headers=_auth(TOKENS['admin']), timeout=10)
        assert r.status_code == 400

    def test_admin_sos_list(self):
        r = requests.get(f"{API}/admin/sos", headers=_auth(TOKENS['admin']), timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_taxis_queue_ops(self):
        for path in ('/admin/taxis', '/admin/queue', '/admin/operations'):
            r = requests.get(f"{API}{path}", headers=_auth(TOKENS['admin']), timeout=10)
            assert r.status_code == 200
            assert isinstance(r.json(), list)

    def test_admin_create_delete_rank_route(self):
        h = _auth(TOKENS['admin'])
        rk = requests.post(f"{API}/admin/ranks",
                          json={"rank_name": "TEST Rank", "location": "Testville"},
                          headers=h, timeout=10)
        assert rk.status_code == 200
        rk_id = rk.json()['id']
        rt = requests.post(f"{API}/admin/routes",
                          json={"rank_name": "TEST Rank", "route": "TEST Route", "fare": "R10"},
                          headers=h, timeout=10)
        assert rt.status_code == 200
        rt_id = rt.json()['id']
        assert requests.delete(f"{API}/admin/routes/{rt_id}", headers=h).status_code == 200
        assert requests.delete(f"{API}/admin/ranks/{rk_id}", headers=h).status_code == 200
