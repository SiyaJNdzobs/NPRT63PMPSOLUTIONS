"""Login regression tests - verify seeded credentials work after DB reset.
NON-DESTRUCTIVE: does NOT call change-secret on any seeded account."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"

SEEDED = [
    ("admin",    "siya@erank.co.za", "erank2026",  True),
    ("owner",    "Mzamo Vilakazi",   "123456",     True),
    ("marshal",  "Muzi Sogoni",      "123456789",  True),
    ("driver",   "Sizwe Dlomo",      "12345678",   True),
    ("passenger","Lizwi Lakhe",      "246810",     False),
]


@pytest.mark.parametrize("role,identifier,secret,expected_must_change", SEEDED)
def test_seeded_login_success(role, identifier, secret, expected_must_change):
    r = requests.post(f"{API}/auth/login", json={"role": role, "identifier": identifier, "secret": secret}, timeout=15)
    assert r.status_code == 200, f"{role}/{identifier} login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 0
    assert "user" in data
    user = data["user"]
    assert user.get("must_change") == expected_must_change, f"{role} must_change expected {expected_must_change}, got {user.get('must_change')}"


def test_wrong_secret_returns_401():
    r = requests.post(f"{API}/auth/login", json={"role": "owner", "identifier": "Mzamo Vilakazi", "secret": "000000"}, timeout=15)
    assert r.status_code == 401, f"Expected 401 for wrong secret, got {r.status_code}: {r.text}"
    body = r.json()
    # friendly message
    msg = (body.get("detail") or body.get("message") or "").lower()
    assert msg, "No error message returned"


def test_correct_secret_still_works_after_wrong():
    # sanity: hashing/verify intact
    r = requests.post(f"{API}/auth/login", json={"role": "owner", "identifier": "Mzamo Vilakazi", "secret": "123456"}, timeout=15)
    assert r.status_code == 200


def test_change_secret_flow_with_throwaway_passenger():
    unique = str(int(time.time()))
    payload = {
        "full_name": f"TEST Throwaway {unique}",
        "contact_number": f"0700{unique[-6:]}",
        "email": f"test_throwaway_{unique}@example.com",
        "pin": "111111",
    }
    reg = requests.post(f"{API}/auth/register", json=payload, timeout=15)
    assert reg.status_code in (200, 201), f"register failed: {reg.status_code} {reg.text}"
    reg_data = reg.json()
    token = reg_data.get("token")
    assert token, f"No token in register response: {reg_data}"

    # change-secret with token
    ch = requests.post(f"{API}/auth/change-secret",
                       json={"new_secret": "222222"},
                       headers={"Authorization": f"Bearer {token}"},
                       timeout=15)
    assert ch.status_code in (200, 204), f"change-secret failed: {ch.status_code} {ch.text}"

    # login again with new PIN
    login2 = requests.post(f"{API}/auth/login",
                           json={"role": "passenger", "identifier": payload["full_name"], "secret": "222222"},
                           timeout=15)
    assert login2.status_code == 200, f"login with new PIN failed: {login2.status_code} {login2.text}"

    # old PIN must fail
    old = requests.post(f"{API}/auth/login",
                        json={"role": "passenger", "identifier": payload["full_name"], "secret": "111111"},
                        timeout=15)
    assert old.status_code == 401
