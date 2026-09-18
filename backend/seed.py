import uuid
from core import db, hash_secret, normalize_phone, fare_to_int, fare_label, now_iso

ADMINS = [
    ("Siya", "siya@erank.co.za", "erank2026"),
    ("Oara", "oara@erank.co.za", "erank2026"),
    ("Bron", "bron@erank.co.za", "erank2026"),
    ("Ona", "ona@erank.co.za", "erank2026"),
    ("Louisa", "louisa@erank.co.za", "erank2026"),
]

RANKS = [
    ("MTN Rank", "Johannesburg", -26.2041, 28.0473),
    ("Indian Center", "Kimberly", -28.7282, 24.7499),
    ("Swazi Rank", "Mpumalanga", -25.4753, 30.9694),
    ("uNcedo Rank", "Mthatha", -31.5889, 28.7844),
    ("Wandaras", "Johannesburg", -26.2041, 28.0473),
]

OWNERS = [
    ("Mzamo Vilakazi", "mzamovilakazi@gmail.com", "+27723652784", "MTN Rank", "123456"),
    ("Ofentse Maakwe", "ofentsemaakwe@gmail.com", "+27823651485", "Indian Center", "123456"),
    ("Joe Ferrari Sibanyoni", "joesibanyoni@gmail.com", "+27712583695", "Swazi Rank", "123456"),
    ("Bulelani Diko", "bulelanidiko@gmail.com", "+27712583696", "uNcedo Rank", "123456"),
    ("Joseph Makaula", "josephmakaula@gmail.com", "+27642589743", "Wandaras", "123456"),
]

MARSHALS = [
    ("Muzi Sogoni", "+27794568526", "MTN Rank", "123456789"),
    ("Lesedi Morata", "+27792486526", "Indian Center", "123456789"),
    ("Sizwe Thalede", "+27642568526", "Swazi Rank", "123456789"),
    ("Sixolise Langa", "+27832568526", "uNcedo Rank", "123456789"),
    ("Tshepo Baloyi", "+27724518506", "Wandaras", "123456789"),
]

# name, cell, owner, taxi_reg, rank
DRIVERS = [
    ("Sizwe Dlomo", "+27815698452", "Mzamo Vilakazi", "MT 004 GP", "MTN Rank"),
    ("Bokang Tshabalala", "+27815298452", "Mzamo Vilakazi", "MT 005 GP", "MTN Rank"),
    ("Sonny Slovo", "+27648598452", "Mzamo Vilakazi", "MT 006 GP", "MTN Rank"),
    ("Moroti Fani", "+27642531452", "Ofentse Maakwe", "IN 121 NC", "Indian Center"),
    ("Tshepang Moloi", "+27712586459", "Ofentse Maakwe", "IN 122 NC", "Indian Center"),
    ("Owen Mathe", "+27843652185", "Ofentse Maakwe", "IN 123 NC", "Indian Center"),
    ("Sandile Kwezo", "+27692543851", "Joe Ferrari Sibanyoni", "SZ 181 MP", "Swazi Rank"),
    ("Mawande Fothe", "+27841892185", "Joe Ferrari Sibanyoni", "SZ 182 MP", "Swazi Rank"),
    ("Bonke Zitha", "+27841452185", "Joe Ferrari Sibanyoni", "SZ 183 MP", "Swazi Rank"),
    ("Zuko Nofukula", "+27841253185", "Bulelani Diko", "UC 210 EC", "uNcedo Rank"),
    ("Mazwi Zakhele", "+27840232185", "Bulelani Diko", "UC 211 EC", "uNcedo Rank"),
    ("Ongeziwe Fikela", "+27820202185", "Bulelani Diko", "UC 212 EC", "uNcedo Rank"),
    ("Funi Mudzwari", "+27841818534", "Joseph Makaula", "CP 118 GP", "Wandaras"),
    ("Popi Diamond", "+27721834525", "Joseph Makaula", "WD 119 GP", "Wandaras"),
    ("Sandile Shezi", "+27835682185", "Joseph Makaula", "WD 120 GP", "Wandaras"),
]

# reg, seats, owner, driver, rank, route, fare
TAXIS = [
    ("MT 004 GP", 15, "Mzamo Vilakazi", "Sizwe Dlomo", "MTN Rank", "Local", "R26"),
    ("MT 005 GP", 15, "Mzamo Vilakazi", "Bokang Tshabalala", "MTN Rank", "Local", "R26"),
    ("MT 006 GP", 15, "Mzamo Vilakazi", "Sonny Slovo", "MTN Rank", "Local", "R26"),
    ("IN 121 NC", 15, "Ofentse Maakwe", "Moroti Fani", "Indian Center", "Local", "R15"),
    ("IN 122 NC", 15, "Ofentse Maakwe", "Tshepang Moloi", "Indian Center", "Indian Center Kimberly \u2194 Wandaras Johannesburg", "R450"),
    ("IN 123 NC", 15, "Ofentse Maakwe", "Owen Mathe", "Indian Center", "Indian Center Kimberly \u2194 Wandaras Johannesburg", "R450"),
    ("SZ 181 MP", 15, "Joe Ferrari Sibanyoni", "Sandile Kwezo", "Swazi Rank", "Local", "R22"),
    ("SZ 182 MP", 15, "Joe Ferrari Sibanyoni", "Mawande Fothe", "Swazi Rank", "Local", "R22"),
    ("SZ 183 MP", 15, "Joe Ferrari Sibanyoni", "Bonke Zitha", "Swazi Rank", "Swazi Rank Mpumalanga \u2194 Wandaras Johannesburg", "R650"),
    ("UC 210 EC", 15, "Bulelani Diko", "Zuko Nofukula", "uNcedo Rank", "Local", "R15"),
    ("UC 211 EC", 15, "Bulelani Diko", "Mazwi Zakhele", "uNcedo Rank", "Local", "R15"),
    ("UC 212 EC", 15, "Bulelani Diko", "Ongeziwe Fikela", "uNcedo Rank", "uNcedo Eastern Cape \u2194 Wandaras Johannesburg", "R800"),
    ("CP 118 GP", 15, "Joseph Makaula", "Funi Mudzwari", "Wandaras", "Johannesburg \u2192 Kimberley", "R30"),
    ("WD 119 GP", 15, "Joseph Makaula", "Popi Diamond", "Wandaras", "Wandaras Johannesburg \u2194 Indian Center Kimberly", "R450"),
    ("WD 120 GP", 15, "Joseph Makaula", "Sandile Shezi", "Wandaras", "uNcedo Eastern Cape \u2194 Wandaras Johannesburg", "R800"),
]

PASSENGERS = [
    ("Lizwi Lakhe", "+27721234567", "lizwi.lakhe@gmail.com", "246810", False),
]


async def _upsert_user(query, doc, secret):
    doc = dict(doc)
    must_change = doc.pop('must_change', True)
    existing = await db.users.find_one(query)
    if existing:
        # Existing user: preserve their updated password and must_change status!
        doc.pop('id', None)
        doc.pop('secret_hash', None)
        doc.pop('must_change', None)
        doc['default_pin'] = secret
        await db.users.update_one(query, {'$set': doc})
    else:
        # First-time user creation: initialize secret, default_pin, and must_change flag
        doc['id'] = str(uuid.uuid4())
        doc['secret_hash'] = hash_secret(secret)
        doc['default_pin'] = secret
        doc['must_change'] = must_change
        doc['created_at'] = now_iso()
        await db.users.insert_one(doc)


async def seed():
    # Ranks
    for name, loc, lat, lng in RANKS:
        await db.ranks.update_one(
            {'rank_name': name},
            {'$set': {'rank_name': name, 'location': loc, 'geo_lat': lat, 'geo_lng': lng},
             '$setOnInsert': {'id': str(uuid.uuid4()), 'geo_check_enabled': False,
                              'qr_token': str(uuid.uuid4())}},
            upsert=True,
        )

    # Routes
    for _, _, _, reg_route, _, route, fare in [(*t,) for t in TAXIS]:
        pass
    routes_set = {}
    for reg, seats, owner, driver, rank, route, fare in TAXIS:
        routes_set[(rank, route)] = fare
    for (rank, route), fare in routes_set.items():
        await db.routes.update_one(
            {'rank_name': rank, 'route': route},
            {'$set': {'rank_name': rank, 'route': route, 'fare_amount': fare_to_int(fare),
                      'fare_label': fare_label(fare)},
             '$setOnInsert': {'id': str(uuid.uuid4())}},
            upsert=True,
        )

    # Admins
    for name, email, pw in ADMINS:
        await _upsert_user(
            {'role': 'admin', 'email': email.lower()},
            {'role': 'admin', 'full_name': name, 'username': name.strip().lower(),
             'email': email.lower(), 'must_change': True},
            pw,
        )

    # Owners
    for name, email, cell, rank, pin in OWNERS:
        await _upsert_user(
            {'role': 'owner', 'username': name.strip().lower()},
            {'role': 'owner', 'full_name': name, 'username': name.strip().lower(),
             'email': email.lower(), 'cell_phone': normalize_phone(cell),
             'rank_name': rank, 'must_change': True},
            pin,
        )

    # Marshals
    for name, cell, rank, pin in MARSHALS:
        await _upsert_user(
            {'role': 'marshal', 'username': name.strip().lower()},
            {'role': 'marshal', 'full_name': name, 'username': name.strip().lower(),
             'cell_phone': normalize_phone(cell), 'rank_name': rank, 'must_change': True},
            pin,
        )

    # Drivers
    driver_ids = {}
    for name, cell, owner, reg, rank in DRIVERS:
        await _upsert_user(
            {'role': 'driver', 'username': name.strip().lower()},
            {'role': 'driver', 'full_name': name, 'username': name.strip().lower(),
             'cell_phone': normalize_phone(cell), 'owner_name': owner,
             'taxi_registration': reg, 'rank_name': rank, 'must_change': True},
            "12345678",
        )
        d = await db.users.find_one({'role': 'driver', 'username': name.strip().lower()})
        driver_ids[name] = d['id']

    # Taxis
    for reg, seats, owner, driver, rank, route, fare in TAXIS:
        await db.taxis.update_one(
            {'registration': reg},
            {'$set': {'registration': reg, 'seats': seats, 'owner_name': owner,
                      'driver_name': driver, 'driver_id': driver_ids.get(driver),
                      'rank_name': rank, 'route': route, 'fare_amount': fare_to_int(fare),
                      'fare_label': fare_label(fare)},
             '$setOnInsert': {'id': str(uuid.uuid4()), 'active_queue': False}},
            upsert=True,
        )

    # Passengers
    for name, cell, email, pin, must_change in PASSENGERS:
        await _upsert_user(
            {'role': 'passenger', 'username': name.strip().lower()},
            {'role': 'passenger', 'full_name': name, 'username': name.strip().lower(),
             'email': email.lower(), 'cell_phone': normalize_phone(cell),
             'must_change': must_change},
            pin,
        )

    # Rank updates
    existing_update = await db.rank_updates.find_one({'title': 'Illegal Immigrants March \u2013 MTN Rank'})
    if not existing_update:
        await db.rank_updates.insert_one({
            'id': str(uuid.uuid4()),
            'marshal_name': 'Muzi Sogoni',
            'rank_name': 'MTN Rank',
            'title': 'Illegal Immigrants March \u2013 MTN Rank',
            'message': ('An illegal immigrants march is happening. Passengers are advised to look out '
                        'and expect violence and traffic jams. However, operations are still happening.'),
            'status': 'Active',
            'created_at': now_iso(),
        })

    # Indexes
    await db.users.create_index([('role', 1), ('username', 1)])
    await db.users.create_index('id')
    await db.taxis.create_index('registration', unique=True)
    await db.queue.create_index('taxi_registration')

    # Backfill default_pin for any existing database users missing it
    for role, def_pin in [('admin', 'erank2026'), ('owner', '123456'), ('marshal', '123456789'), ('driver', '12345678'), ('passenger', '1234')]:
        await db.users.update_many({'role': role, 'default_pin': {'$exists': False}}, {'$set': {'default_pin': def_pin}})
    await db.users.update_one({'role': 'passenger', 'username': 'lizwi lakhe', 'default_pin': {'$in': [None, '1234']}}, {'$set': {'default_pin': '246810'}})
