"""
E-RANK login re-test after seed credential reset.
IMPORTANT: Do NOT run change-secret against seeded accounts.
Use a throwaway passenger to exercise change-secret.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
API = f"{BASE_URL}/api"


def _login(role, identifier, secret):
    return requests.post(
        f"{API}/auth/login",
        json={"role": role, "identifier": identifier, "secret": secret},
        timeout=15,
    )


# (role, identifier, secret, expected_must_change)
SEEDED = [
    ("admin", "siya@erank.co.za", "erank2026", True),
    ("admin", "oara@erank.co.za", "erank2026", True),
    ("owner", "Mzamo Vilakazi", "123456", True),
    ("owner", "Ofentse Maakwe", "123456", True),
    ("marshal", "Muzi Sogoni", "123456789", True),
    ("marshal", "Lesedi Morata", "123456789", True),
    ("driver", "Sizwe Dlomo", "12345678", True),
    ("driver", "Owen Mathe", "12345678", True),
    ("passenger", "Lizwi Lakhe", "246810", False),
]


@pytest.mark.parametrize("role,identifier,secret,must_change", SEEDED)
def test_seeded_login_original_credentials(role, identifier, secret, must_change):
    r = _login(role, identifier, secret)
    assert r.status_code == 200, (
        f"Login failed for {role} {identifier}: HTTP {r.status_code} - {r.text}"
    )
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and data["token"]
    assert "user" in data
    u = data["user"]
    assert u["role"] == role
    assert u.get("must_change") is must_change, (
        f"{role} {identifier} must_change={u.get('must_change')} expected {must_change}"
    )


def test_wrong_secret_returns_401():
    r = _login("admin", "siya@erank.co.za", "definitely-wrong")
    assert r.status_code == 401
    body = r.json()
    assert body.get("detail") == "Wrong details. Please check and try again."


def test_wrong_pin_owner_returns_401():
    r = _login("owner", "Mzamo Vilakazi", "000000")
    assert r.status_code == 401
    assert r.json().get("detail") == "Wrong details. Please check and try again."


def test_change_secret_via_throwaway_passenger():
    """Register a passenger and exercise /auth/change-secret on it — not a seeded account."""
    name = f"TEST User {uuid.uuid4().hex[:6]}"
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    reg = requests.post(f"{API}/auth/register", json={
        "full_name": name,
        "contact_number": "0821234567",
        "email": email,
        "pin": "112233",
    }, timeout=15)
    assert reg.status_code == 200, reg.text
    token = reg.json()["token"]
    # change pin
    cr = requests.post(
        f"{API}/auth/change-secret",
        json={"new_secret": "998877"},
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    assert cr.status_code == 200, cr.text
    # login with new pin
    r2 = _login("passenger", name, "998877")
    assert r2.status_code == 200
    assert r2.json()["user"]["must_change"] is False
    # old pin should now fail
    r3 = _login("passenger", name, "112233")
    assert r3.status_code == 401
