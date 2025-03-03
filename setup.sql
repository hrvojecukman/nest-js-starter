
CREATE DATABASE ousol;

CREATE USER ousol_user WITH ENCRYPTED PASSWORD 'securepassword';

ALTER ROLE ousol_user SET client_encoding TO 'utf8';
ALTER ROLE ousol_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ousol_user SET timezone TO 'UTC';

GRANT ALL PRIVILEGES ON DATABASE ousol TO ousol_user;