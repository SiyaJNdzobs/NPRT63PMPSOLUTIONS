"""
Additional coverage for review round 3:
- Marshal ADD enforces rank scope
- Marshal ADD rejects double queue
- Driver join via token (correct rank succeeds, wrong rank rejected)

Does NOT call /auth/change-secret on any seeded account.
"""
import os
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


S = {}


@pytest.fixture(scope="module", autouse=True)
def bootstrap():
    r = _login("marshal", "Muzi Sogoni", "123456789")
    assert r.status_code == 200, r.text
    S['marshal_mtn'] = r.json()['token']

    r = _login("marshal", "Lesedi Morata", "123456789")
    assert r.status_code == 200, r.text
    S['marshal_indian'] = r.json()['token']

    r = _login("driver", "Sizwe Dlomo", "12345678")
    assert r.status_code == 200, r.text
    S['driver'] = r.json()['token']

    # geo off both marshals
    for k in ('marshal_mtn', 'marshal_indian'):
        requests.post(f"{API}/marshal/geo-check", json={"enabled": False},
                      headers=_auth(S[k]), timeout=10)
    yield


class TestMarshalRankScope:
    def test_add_taxi_from_other_rank_rejected(self):
        # MT 004 GP belongs to MTN rank; adding via Indian Center marshal must fail
        r = requests.post(f"{API}/marshal/queue/add",
                          json={"registration": "MT 004 GP"},
                          headers=_auth(S['marshal_indian']), timeout=10)
        assert r.status_code == 400, r.text

    def test_double_queue_rejected(self):
        h = _auth(S['marshal_mtn'])
        # First add (may already exist from prior tests -> depart to reset)
        requests.post(f"{API}/marshal/queue/depart",
                      json={"registration": "MT 004 GP"}, headers=h, timeout=10)
        a1 = requests.post(f"{API}/marshal/queue/add",
                           json={"registration": "MT 004 GP"}, headers=h, timeout=10)
        assert a1.status_code == 200, a1.text
        a2 = requests.post(f"{API}/marshal/queue/add",
                           json={"registration": "MT 004 GP"}, headers=h, timeout=10)
        assert a2.status_code == 400
        # cleanup
        requests.post(f"{API}/marshal/queue/depart",
                      json={"registration": "MT 004 GP"}, headers=h, timeout=10)


class TestDriverJoinViaToken:
    def test_join_with_correct_rank_token(self):
        # Marshal MTN issues QR
        qr = requests.get(f"{API}/marshal/qr",
                          headers=_auth(S['marshal_mtn']), timeout=10)
        assert qr.status_code == 200, qr.text
        token = qr.json().get('token') or qr.json().get('qr_token') or qr.json().get('code')
        assert token, f"no token in QR response: {qr.json()}"

        # Ensure driver's taxi is not already queued
        requests.post(f"{API}/marshal/queue/depart",
                      json={"registration": "MT 004 GP"},
                      headers=_auth(S['marshal_mtn']), timeout=10)

        r = requests.post(f"{API}/driver/join",
                         json={"token": token, "lat": None, "lng": None},
                         headers=_auth(S['driver']), timeout=10)
        assert r.status_code == 200, r.text

        # Cleanup: depart
        requests.post(f"{API}/marshal/queue/depart",
                      json={"registration": "MT 004 GP"},
                      headers=_auth(S['marshal_mtn']), timeout=10)

    def test_join_with_wrong_rank_token(self):
        # Get Indian Center token but driver is MTN
        qr = requests.get(f"{API}/marshal/qr",
                          headers=_auth(S['marshal_indian']), timeout=10)
        assert qr.status_code == 200
        token = qr.json().get('token') or qr.json().get('qr_token') or qr.json().get('code')
        assert token

        r = requests.post(f"{API}/driver/join",
                         json={"token": token, "lat": None, "lng": None},
                         headers=_auth(S['driver']), timeout=10)
        assert r.status_code == 400, r.text
        assert "wrong rank" in r.json().get('detail', '').lower() or \
               "rank" in r.json().get('detail', '').lower()
