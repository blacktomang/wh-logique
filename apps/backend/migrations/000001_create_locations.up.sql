CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    zone VARCHAR(1) NOT NULL,
    type VARCHAR(32) NOT NULL,
    CONSTRAINT locations_code_not_blank CHECK (btrim(code) <> ''),
    CONSTRAINT locations_zone_valid CHECK (zone IN ('A', 'B', 'C')),
    CONSTRAINT locations_type_valid CHECK (
        type IN ('rack', 'shelf', 'bin', 'floor', 'cold_storage')
    ),
    CONSTRAINT locations_zone_type_unique UNIQUE (zone, type)
);
