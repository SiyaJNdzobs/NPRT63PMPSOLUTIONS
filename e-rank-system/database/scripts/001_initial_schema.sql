-- =============================================
-- This 1st script is for clearing, any exixting tables that may cause table duplication
-- =============================================

-- Clean slate
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS revenues CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS queues CASCADE;
DROP TABLE IF EXISTS passengers CASCADE;
DROP TABLE IF EXISTS marshals CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS taxis CASCADE;
DROP TABLE IF EXISTS taxi_ranks CASCADE;
DROP TABLE IF EXISTS owners CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS admin_codes CASCADE;

-- =============================================
-- ROLES
-- =============================================
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (role_name) VALUES
  ('admin'),
  ('owner'),
  ('driver'),
  ('marshal'),
  ('passenger');

-- =============================================
-- USERS
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_names VARCHAR(150) NOT NULL,
  cellphone VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id INT REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- ADMIN SECRET CODES
-- Change 7391 to any 4 digits you prefer (this is for security purpose team must be very secretive with these code and be advised you are expected to change the generic code to you own secret code and protect it)
-- =============================================
CREATE TABLE admin_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(4) UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO admin_codes (code) VALUES ('7391');

-- =============================================
-- ADMINS
-- =============================================
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TAXI RANKS
-- =============================================
CREATE TABLE taxi_ranks (
  id SERIAL PRIMARY KEY,
  rank_name VARCHAR(150) UNIQUE NOT NULL,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Taxi ranks are prpopulated to ensure testing is possible and reduce admin work of adding them manually

INSERT INTO taxi_ranks (rank_name, location) VALUES
  ('Kimberley Station Rank', 'Kimberley, Northern Cape'),
  ('Galeshewe Rank', 'Galeshewe, Kimberley'),
  ('Kuruman Rank', 'Kuruman, Northern Cape'),
  ('Bloemfontein CBD Rank', 'Bloemfontein, Free State'),
  ('Johannesburg Park Station', 'Johannesburg, Gauteng'),
  ('Pretoria Central Rank', 'Pretoria, Gauteng');

-- =============================================
-- ROUTES
-- =============================================
CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  route_name VARCHAR(200) NOT NULL,
  origin VARCHAR(150),
  destination VARCHAR(150),
  distance_km DECIMAL(8,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- OWNERS
-- =============================================
CREATE TABLE owners (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(200),
  fleet_details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TAXIS
-- =============================================
CREATE TABLE taxis (
  id SERIAL PRIMARY KEY,
  owner_id INT REFERENCES owners(id) ON DELETE CASCADE,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  taxi_name VARCHAR(150),
  route_info TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- MARSHALS
-- =============================================
CREATE TABLE marshals (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rank_id INT REFERENCES taxi_ranks(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- DRIVERS
-- =============================================
CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  owner_id INT REFERENCES owners(id),
  taxi_id INT REFERENCES taxis(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- PASSENGERS
-- =============================================
CREATE TABLE passengers (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- QUEUES
-- =============================================
CREATE TABLE queues (
  id SERIAL PRIMARY KEY,
  taxi_id INT REFERENCES taxis(id),
  rank_id INT REFERENCES taxi_ranks(id),
  driver_id INT REFERENCES drivers(id),
  queue_position INT NOT NULL,
  status VARCHAR(50) DEFAULT 'waiting',
  joined_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- =============================================
-- TRIPS
-- =============================================
CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  taxi_id INT REFERENCES taxis(id),
  driver_id INT REFERENCES drivers(id),
  rank_id INT REFERENCES taxi_ranks(id),
  route_id INT REFERENCES routes(id),
  trip_type VARCHAR(20) DEFAULT 'local',
  passenger_count INT DEFAULT 0,
  fare_total DECIMAL(10,2),
  trip_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'completed'
);

-- =============================================
-- REVENUES
-- =============================================
CREATE TABLE revenues (
  id SERIAL PRIMARY KEY,
  owner_id INT REFERENCES owners(id),
  taxi_id INT REFERENCES taxis(id),
  trip_id INT REFERENCES trips(id),
  amount DECIMAL(10,2),
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- REVIEWS
-- =============================================
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  passenger_id INT REFERENCES passengers(id),
  driver_id INT REFERENCES drivers(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 10 SIMULATED OWNERS
-- =============================================
INSERT INTO users (full_names, cellphone, password_hash, role_id) VALUES
  ('Thabo Molefe',        '0711000001', 'placeholder_hash', 2),
  ('Sipho Dlamini',       '0711000002', 'placeholder_hash', 2),
  ('Kagiso Sithole',      '0711000003', 'placeholder_hash', 2),
  ('Bongani Nkosi',       '0711000004', 'placeholder_hash', 2),
  ('Lerato Motsepe',      '0711000005', 'placeholder_hash', 2),
  ('Nthabiseng Mokoena',  '0711000006', 'placeholder_hash', 2),
  ('Dineo Sefako',        '0711000007', 'placeholder_hash', 2),
  ('Pule Ramaphosa',      '0711000008', 'placeholder_hash', 2),
  ('Tebogo Lekgowa',      '0711000009', 'placeholder_hash', 2),
  ('Zanele Mahlangu',     '0711000010', 'placeholder_hash', 2);

INSERT INTO owners (user_id, company_name) VALUES
  ((SELECT id FROM users WHERE cellphone='0711000001'),'Molefe Transport'),
  ((SELECT id FROM users WHERE cellphone='0711000002'),'Dlamini Taxis'),
  ((SELECT id FROM users WHERE cellphone='0711000003'),'Sithole Carriers'),
  ((SELECT id FROM users WHERE cellphone='0711000004'),'Nkosi Fleet'),
  ((SELECT id FROM users WHERE cellphone='0711000005'),'Motsepe Taxis'),
  ((SELECT id FROM users WHERE cellphone='0711000006'),'Mokoena Transport'),
  ((SELECT id FROM users WHERE cellphone='0711000007'),'Sefako Taxis'),
  ((SELECT id FROM users WHERE cellphone='0711000008'),'Ramaphosa Carriers'),
  ((SELECT id FROM users WHERE cellphone='0711000009'),'Lekgowa Fleet'),
  ((SELECT id FROM users WHERE cellphone='0711000010'),'Mahlangu Transport');

-- =============================================
-- 100 SIMULATED TAXIS (10 per owner) for testing reasons too while actual data is to be populated when we get to ops phase
-- =============================================
INSERT INTO taxis (owner_id, registration_number, taxi_name, route_info) VALUES
(1,'BFN 101 NC','Molefe 1','Kimberley - Galeshewe'),
(1,'BFN 102 NC','Molefe 2','Kimberley - Galeshewe'),
(1,'BFN 103 NC','Molefe 3','Kimberley - Kuruman'),
(1,'BFN 104 NC','Molefe 4','Kimberley - Bloemfontein'),
(1,'BFN 105 NC','Molefe 5','Kimberley - Johannesburg'),
(1,'BFN 106 NC','Molefe 6','Kimberley - Pretoria'),
(1,'BFN 107 NC','Molefe 7','Galeshewe - Kimberley'),
(1,'BFN 108 NC','Molefe 8','Galeshewe - Bloemfontein'),
(1,'BFN 109 NC','Molefe 9','Kimberley - Upington'),
(1,'BFN 110 NC','Molefe 10','Kimberley - Douglas'),
(2,'NWK 201 GP','Dlamini 1','Johannesburg - Pretoria'),
(2,'NWK 202 GP','Dlamini 2','Johannesburg - Kimberley'),
(2,'NWK 203 GP','Dlamini 3','Johannesburg - Bloemfontein'),
(2,'NWK 204 GP','Dlamini 4','Johannesburg - Soweto'),
(2,'NWK 205 GP','Dlamini 5','Johannesburg - Sandton'),
(2,'NWK 206 GP','Dlamini 6','Johannesburg - Randburg'),
(2,'NWK 207 GP','Dlamini 7','Johannesburg - Roodepoort'),
(2,'NWK 208 GP','Dlamini 8','Johannesburg - Tembisa'),
(2,'NWK 209 GP','Dlamini 9','Johannesburg - Alexandra'),
(2,'NWK 210 GP','Dlamini 10','Johannesburg - Midrand'),
(3,'CAA 301 FS','Sithole 1','Bloemfontein - Kimberley'),
(3,'CAA 302 FS','Sithole 2','Bloemfontein - Johannesburg'),
(3,'CAA 303 FS','Sithole 3','Bloemfontein - Pretoria'),
(3,'CAA 304 FS','Sithole 4','Bloemfontein - Maseru'),
(3,'CAA 305 FS','Sithole 5','Bloemfontein - Durban'),
(3,'CAA 306 FS','Sithole 6','Bloemfontein - Cape Town'),
(3,'CAA 307 FS','Sithole 7','Bloemfontein - Welkom'),
(3,'CAA 308 FS','Sithole 8','Bloemfontein - Kroonstad'),
(3,'CAA 309 FS','Sithole 9','Bloemfontein - Botshabelo'),
(3,'CAA 310 FS','Sithole 10','Bloemfontein - Thaba Nchu'),
(4,'KZN 401 NP','Nkosi 1','Durban - Johannesburg'),
(4,'KZN 402 NP','Nkosi 2','Durban - Pretoria'),
(4,'KZN 403 NP','Nkosi 3','Durban - Pietermaritzburg'),
(4,'KZN 404 NP','Nkosi 4','Durban - Richards Bay'),
(4,'KZN 405 NP','Nkosi 5','Durban - Newcastle'),
(4,'KZN 406 NP','Nkosi 6','Durban - Ladysmith'),
(4,'KZN 407 NP','Nkosi 7','Durban - Empangeni'),
(4,'KZN 408 NP','Nkosi 8','Durban - Ulundi'),
(4,'KZN 409 NP','Nkosi 9','Durban - Mtubatuba'),
(4,'KZN 410 NP','Nkosi 10','Durban - Port Shepstone'),
(5,'PTR 501 GP','Motsepe 1','Pretoria - Johannesburg'),
(5,'PTR 502 GP','Motsepe 2','Pretoria - Soweto'),
(5,'PTR 503 GP','Motsepe 3','Pretoria - Kimberley'),
(5,'PTR 504 GP','Motsepe 4','Pretoria - Bloemfontein'),
(5,'PTR 505 GP','Motsepe 5','Pretoria - Polokwane'),
(5,'PTR 506 GP','Motsepe 6','Pretoria - Nelspruit'),
(5,'PTR 507 GP','Motsepe 7','Pretoria - Rustenburg'),
(5,'PTR 508 GP','Motsepe 8','Pretoria - Witbank'),
(5,'PTR 509 GP','Motsepe 9','Pretoria - Mafikeng'),
(5,'PTR 510 GP','Motsepe 10','Pretoria - Midrand'),
(6,'MOK 601 NC','Mokoena 1','Kuruman - Kimberley'),
(6,'MOK 602 NC','Mokoena 2','Kuruman - Upington'),
(6,'MOK 603 NC','Mokoena 3','Kuruman - Johannesburg'),
(6,'MOK 604 NC','Mokoena 4','Kuruman - Hotazel'),
(6,'MOK 605 NC','Mokoena 5','Kuruman - Kathu'),
(6,'MOK 606 NC','Mokoena 6','Kuruman - Postmasburg'),
(6,'MOK 607 NC','Mokoena 7','Kuruman - Olifantshoek'),
(6,'MOK 608 NC','Mokoena 8','Kuruman - Sishen'),
(6,'MOK 609 NC','Mokoena 9','Kuruman - Pofadder'),
(6,'MOK 610 NC','Mokoena 10','Kuruman - Springbok'),
(7,'SEF 701 NW','Sefako 1','Mafikeng - Johannesburg'),
(7,'SEF 702 NW','Sefako 2','Mafikeng - Pretoria'),
(7,'SEF 703 NW','Sefako 3','Mafikeng - Rustenburg'),
(7,'SEF 704 NW','Sefako 4','Mafikeng - Zeerust'),
(7,'SEF 705 NW','Sefako 5','Mafikeng - Lichtenburg'),
(7,'SEF 706 NW','Sefako 6','Mafikeng - Klerksdorp'),
(7,'SEF 707 NW','Sefako 7','Mafikeng - Potchefstroom'),
(7,'SEF 708 NW','Sefako 8','Mafikeng - Vryburg'),
(7,'SEF 709 NW','Sefako 9','Mafikeng - Gaborone'),
(7,'SEF 710 NW','Sefako 10','Mafikeng - Kimberley'),
(8,'RAM 801 LP','Ramaphosa 1','Polokwane - Johannesburg'),
(8,'RAM 802 LP','Ramaphosa 2','Polokwane - Pretoria'),
(8,'RAM 803 LP','Ramaphosa 3','Polokwane - Tzaneen'),
(8,'RAM 804 LP','Ramaphosa 4','Polokwane - Louis Trichardt'),
(8,'RAM 805 LP','Ramaphosa 5','Polokwane - Mokopane'),
(8,'RAM 806 LP','Ramaphosa 6','Polokwane - Phalaborwa'),
(8,'RAM 807 LP','Ramaphosa 7','Polokwane - Musina'),
(8,'RAM 808 LP','Ramaphosa 8','Polokwane - Bela-Bela'),
(8,'RAM 809 LP','Ramaphosa 9','Polokwane - Makhado'),
(8,'RAM 810 LP','Ramaphosa 10','Polokwane - Giyani'),
(9,'LEK 901 EC','Lekgowa 1','East London - Johannesburg'),
(9,'LEK 902 EC','Lekgowa 2','East London - Port Elizabeth'),
(9,'LEK 903 EC','Lekgowa 3','East London - Cape Town'),
(9,'LEK 904 EC','Lekgowa 4','East London - Durban'),
(9,'LEK 905 EC','Lekgowa 5','East London - Mthatha'),
(9,'LEK 906 EC','Lekgowa 6','East London - Queenstown'),
(9,'LEK 907 EC','Lekgowa 7','East London - Bisho'),
(9,'LEK 908 EC','Lekgowa 8','East London - King Williams Town'),
(9,'LEK 909 EC','Lekgowa 9','East London - Grahamstown'),
(9,'LEK 910 EC','Lekgowa 10','East London - Aliwal North'),
(10,'MAH 001 MP','Mahlangu 1','Nelspruit - Johannesburg'),
(10,'MAH 002 MP','Mahlangu 2','Nelspruit - Pretoria'),
(10,'MAH 003 MP','Mahlangu 3','Nelspruit - Hazyview'),
(10,'MAH 004 MP','Mahlangu 4','Nelspruit - White River'),
(10,'MAH 005 MP','Mahlangu 5','Nelspruit - Barberton'),
(10,'MAH 006 MP','Mahlangu 6','Nelspruit - Lydenburg'),
(10,'MAH 007 MP','Mahlangu 7','Nelspruit - Komatipoort'),
(10,'MAH 008 MP','Mahlangu 8','Nelspruit - Piet Retief'),
(10,'MAH 009 MP','Mahlangu 9','Nelspruit - Secunda'),
(10,'MAH 010 MP','Mahlangu 10','Nelspruit - Ermelo');
