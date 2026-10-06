CREATE TABLE stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items (id),
    location_id UUID NOT NULL REFERENCES locations (id),
    qty INTEGER NOT NULL CHECK (qty >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT stocks_item_location_unique UNIQUE (item_id, location_id)
);

CREATE INDEX stocks_item_id_idx ON stocks (item_id);

CREATE TABLE stock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items (id),
    location_id UUID NOT NULL REFERENCES locations (id),
    qty INTEGER NOT NULL CHECK (qty > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX stock_logs_item_id_created_at_id_idx
    ON stock_logs (item_id, created_at DESC, id DESC);
