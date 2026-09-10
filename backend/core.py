import os
import re
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db_name = os.environ.get('DB_NAME', 'erank')
db = client[db_name]

JWT_SECRET = os.environ.get('JWT_SECRET', 'erank_secret_default_key_2026')
JWT_ALG = 'HS256'
APP_BASE_URL = os.environ.get('APP_BASE_URL', '')


def hash_secret(s: str) -> str:
    return bcrypt.hashpw(s.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_secret(s: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(s.encode('utf-8'), h.encode('utf-8'))
    except Exception:
        return False


def normalize_phone(raw) -> str:
    if not raw:
        return raw
    digits = re.sub(r'\D', '', str(raw))
    if digits.startswith('27'):
        digits = digits[2:]
    elif digits.startswith('0'):
        digits = digits[1:]
    return '+27' + digits


def fare_to_int(fare) -> int:
    if fare is None:
        return 0
    m = re.findall(r'\d+', str(fare))
    return int(m[0]) if m else 0


def fare_label(fare) -> str:
    return f"R{fare_to_int(fare)}"


def is_long_distance(route: str) -> bool:
    return bool(route) and route.strip().lower() != 'local'


def create_token(user: dict) -> str:
    payload = {
        'sub': user['id'],
        'role': user['role'],
        'exp': datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


security = HTTPBearer(auto_error=False)


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail='Not authenticated')
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Session expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')
    user = await db.users.find_one({'id': payload['sub']}, {'_id': 0, 'secret_hash': 0})
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    return user


def require_role(*roles):
    async def dep(user=Depends(get_current_user)):
        if user['role'] not in roles:
            raise HTTPException(status_code=403, detail='Not allowed for your role')
        return user
    return dep
