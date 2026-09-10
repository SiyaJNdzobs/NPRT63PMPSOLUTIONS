"""
E-RANK iteration-3 new-feature tests:
- Validation error messages (owner/marshal/taxi)
- Public/passenger taxi lookup now exposes driver_name + driver_contact
- Marshal DEPART flow (short + long-distance)
- Owner revenue endpoint shape
- Login regression for all seeded roles (must_change=True where applicable)

WARNING: Uses seeded PINs directly. Does NOT call /auth/change-secret on any
seeded account — so credentials stay untouched.
"""
import os
import time
import pytest
import requests

BASE_URL = (os.environ.get('REACT_APP_BACKEND_URL')
            or open('/app/frontend/.env').read().split('REACT_APP_BACKEND_URL=')[1].split()[0]).rstrip('/')
API = f"{BASE_URL}/api"


def _login(role, identifier, secret):
    return requests.post(f"{API}/auth/login",
                         json={"role": role, "identifier": identifier, "secret": secret},
                         timeout=15)


def _auth(t):
    return {"Authorization": f"Bearer {t}"}


# Shared state
S = {}


@pytest.fixture(scope="module", autouse=True)
def bootstrap_tokens():
    # Admin
    r = _login("admin", "siya@erank.co.za", "erank2026")
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    assert r.json()['user']['must_change'] is True
    S['admin'] = r.json()['token']

    # Owner
    r = _login("owner", "Mzamo Vilakazi", "123456")
    assert r.status_code == 200, f"owner login: {r.status_code} {r.text}"
    assert r.json()['user']['must_change'] is True
    S['owner'] = r.json()['token']

    # Marshal MTN
    r = _login("marshal", "Muzi Sogoni", "123456789")
    assert r.status_code == 200, f"marshal login: {r.status_code} {r.text}"
    assert r.json()['user']['must_change'] is True
    S['marshal'] = r.json()['token']

    # Marshal Indian Center for long-distance
    r = _login("marshal", "Lesedi Morata", "123456789")
    assert r.status_code == 200, f"marshal2 login: {r.status_code} {r.text}"
    S['marshal_long'] = r.json()['token']

    # Driver Sizwe (short)
    r = _login("driver", "Sizwe Dlomo", "12345678")
    assert r.status_code == 200
    assert r.json()['user']['must_change'] is True
    S['driver'] = r.json()['token']

    # Driver Owen (long-distance)
    r = _login("driver", "Owen Mathe", "12345678")
    assert r.status_code == 200
    S['driver_long'] = r.json()['token']

    # Passenger
    r = _login("passenger", "Lizwi Lakhe", "246810")
    assert r.status_code == 200
    assert r.json()['user']['must_change'] is False
    S['passenger'] = r.json()['token']

    # Turn geo-check off for both marshals so queue-add & join work
    for k in ('marshal', 'marshal_long'):
        requests.post(f"{API}/marshal/geo-check", json={"enabled": False},
                      headers=_auth(S[k]), timeout=10)
    yield


# ------------- Login regression + friendly 401 -------------
class TestLoginRegression:
    def test_wrong_secret_friendly(self):
        r = _login("admin", "siya@erank.co.za", "WRONG")
        assert r.status_code == 401
        d = r.json()
        assert 'detail' in d and len(d['detail']) > 0

    def test_all_roles_login_status_flags(self):
        # values already checked in fixture; sanity re-check
        r = _login("passenger", "Lizwi Lakhe", "246810")
        assert r.status_code == 200
        assert r.json()['user']['role'] == 'passenger'


# ------------- Validation error messages -------------
class TestValidation:
    def test_owner_missing_full_name(self):
        r = requests.post(f"{API}/admin/owners",
                          json={"full_name": "", "email": "x@y.com",
                                "cell_phone": "0821234567",
                                "rank_name": "MTN Rank", "pin": "123456"},
                          headers=_auth(S['admin']), timeout=10)
        assert r.status_code == 400
        assert "owner full name" in r.json()['detail'].lower()

    def test_owner_missing_email(self):
        r = requests.post(f"{API}/admin/owners",
                          json={"full_name": "TEST Owner", "email": "",
                                "cell_phone": "0821234567",
                                "rank_name": "MTN Rank", "pin": "123456"},
                          headers=_auth(S['admin']), timeout=10)
        assert r.status_code == 400
        assert "email" in r.json()['detail'].lower()

    def test_owner_invalid_email(self):
        r = requests.post(f"{API}/admin/owners",
                          json={"full_name": "TEST Owner Invalid", "email": "not-an-email",
                                "cell_phone": "0821234567",
                                "rank_name": "MTN Rank", "pin": "123456"},
                          headers=_auth(S['admin']), timeout=10)
        assert r.status_code == 400
        assert "valid email" in r.json()['detail'].lower()

    def test_owner_missing_cell(self):
        r = requests.post(f"{API}/admin/owners",
                          json={"full_name": "TEST Owner", "email": "a@b.com",
                                "cell_phone": "", "rank_name": "MTN Rank", "pin": "123456"},
                          headers=_auth(S['admin']), timeout=10)
        assert r.status_code == 400
        assert "cell" in r.json()['detail'].lower()

    def test_owner_missing_rank(self):
        r = requests.post(f"{API}/admin/owners",
                          json={"full_name": "TEST Owner", "email": "a@b.com",
                                "cell_phone": "0821234567", "rank_name": "", "pin": "123456"},
                          headers=_auth(S['admin']), timeout=10)
        assert r.status_code == 400

    def test_owner_missing_pin(self):
        r = requests.post(f"{API}/admin/owners",
                          json={"full_name": "TEST Owner", "email": "a@b.com",
                                "cell_phone": "0821234567",
                                "rank_name": "MTN Rank", "pin": ""},
                          headers=_auth(S['admin']), timeout=10)
        assert r.status_code == 400
        assert "pin" in r.json()['detail'].lower()

    def test_marshal_missing_fields(self):
        r = requests.post(f"{API}/admin/marshals",
                          json={"full_name": "", "cell_phone": "0820000000",
                                "rank_name": "MTN Rank", "pin": "1234"},
                          headers=_auth(S['admin']), timeout=10)
        assert r.status_code == 400
        assert "marshal full name" in r.json()['detail'].lower()

    def test_taxi_missing_registration(self):
        r = requests.post(f"{API}/owner/taxis",
                          json={"registration": "", "route": "Local", "fare": "R26",
                                "seats": 15, "driver_name": "TEST D",
                                "driver_cell": "0821234567", "driver_pin": "12345678"},
                          headers=_auth(S['owner']), timeout=10)
        assert r.status_code == 400
        assert "registration" in r.json()['detail'].lower()

    def test_taxi_missing_driver_fields(self):
        r = requests.post(f"{API}/owner/taxis",
                          json={"registration": "TEST 999 GP", "route": "Local",
                                "fare": "R26", "seats": 15,
                                "driver_name": "", "driver_cell": "", "driver_pin": ""},
                          headers=_auth(S['owner']), timeout=10)
        assert r.status_code == 400
        assert "driver" in r.json()['detail'].lower()

    def test_taxi_zero_seats(self):
        r = requests.post(f"{API}/owner/taxis",
                          json={"registration": "TEST 998 GP", "route": "Local",
                                "fare": "R26", "seats": 0,
                                "driver_name": "TEST D", "driver_cell": "0821234567",
                                "driver_pin": "12345678"},
                          headers=_auth(S['owner']), timeout=10)
        assert r.status_code == 400
        assert "seats" in r.json()['detail'].lower()


# ------------- Public / passenger taxi lookup with driver info -------------
class TestPublicPassengerDriverContact:
    def test_public_taxi_has_driver_details(self):
        r = requests.get(f"{API}/public/taxi/MT 004 GP", timeout=10)
        assert r.status_code == 200
        t = r.json()
        assert t['registration'].upper() == "MT 004 GP"
        assert t['verified'] is True
        assert 'share_url' in t
        assert t.get('driver_name') and "sizwe" in t['driver_name'].lower()
        assert t.get('driver_contact', '').startswith('+27'), f"driver_contact={t.get('driver_contact')}"

    def test_passenger_lookup_has_driver_details(self):
        r = requests.get(f"{API}/passenger/lookup",
                         params={"registration": "MT 004 GP"},
                         headers=_auth(S['passenger']), timeout=10)
        assert r.status_code == 200, r.text
        t = r.json()
        assert t.get('driver_name')
        assert t.get('driver_contact', '').startswith('+27')


# ------------- Marshal Depart -------------
class TestMarshalDepart:
    def test_depart_not_in_queue(self):
        # Ensure no queue entry
        r = requests.post(f"{API}/marshal/queue/depart",
                          json={"registration": "MT 004 GP"},
                          headers=_auth(S['marshal']), timeout=10)
        assert r.status_code == 400
        assert "not in your queue" in r.json()['detail'].lower()

    def test_short_route_add_then_depart(self):
        h = _auth(S['marshal'])
        # add
        add = requests.post(f"{API}/marshal/queue/add",
                            json={"registration": "MT 004 GP"},
                            headers=h, timeout=10)
        # If already there, be forgiving
        if add.status_code != 200 and "already" not in add.text.lower():
            pytest.fail(f"queue add failed: {add.status_code} {add.text}")
        # depart
        r = requests.post(f"{API}/marshal/queue/depart",
                          json={"registration": "MT 004 GP"},
                          headers=h, timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        # revenue = fare 26 * seats 15
        assert data['revenue'] == 26 * 15
        # verify removed from queue and taxi idle
        q = requests.get(f"{API}/marshal/queue", headers=h, timeout=10).json()
        assert all(x['taxi_registration'] != "MT 004 GP" for x in q)
        # ensure an operation was recorded
        ops = requests.get(f"{API}/admin/operations",
                           headers=_auth(S['admin']), timeout=10).json()
        assert any(o['taxi_registration'] == "MT 004 GP" and o['revenue'] == 390
                   for o in ops), "no operation recorded for MT 004 GP"

    def test_long_distance_requires_passengers(self):
        h = _auth(S['marshal_long'])
        # add long-distance taxi
        add = requests.post(f"{API}/marshal/queue/add",
                            json={"registration": "IN 123 NC"},
                            headers=h, timeout=10)
        if add.status_code != 200 and "already" not in add.text.lower():
            pytest.fail(f"queue add long failed: {add.status_code} {add.text}")
        # depart WITHOUT passengers
        r1 = requests.post(f"{API}/marshal/queue/depart",
                           json={"registration": "IN 123 NC"},
                           headers=h, timeout=10)
        assert r1.status_code == 400
        assert "long-distance" in r1.json()['detail'].lower() or \
               "passenger" in r1.json()['detail'].lower()
        # depart WITH passengers
        r2 = requests.post(f"{API}/marshal/queue/depart",
                           json={"registration": "IN 123 NC",
                                 "long_distance_passengers": [
                                     {"name": "TEST Pax", "contact": "0821111111",
                                      "destination": "JHB"}
                                 ]},
                           headers=h, timeout=10)
        assert r2.status_code == 200, r2.text


# ------------- Owner Revenue (Rands) shape -------------
class TestOwnerRevenue:
    def test_owner_revenue_shape(self):
        r = requests.get(f"{API}/owner/revenue", headers=_auth(S['owner']), timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert 'total_revenue' in d
        assert 'per_taxi' in d and isinstance(d['per_taxi'], list)
        assert 'operations' in d and isinstance(d['operations'], list)
        # after depart above, MT 004 GP should have revenue
        mt = next((x for x in d['per_taxi'] if x['registration'] == "MT 004 GP"), None)
        assert mt is not None
        assert mt['trips'] >= 1
        assert mt['revenue'] >= 390
