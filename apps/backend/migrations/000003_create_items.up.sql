CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(32) NOT NULL,
    unit VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT items_sku_unique UNIQUE (sku),
    CONSTRAINT items_sku_not_blank CHECK (btrim(sku) <> ''),
    CONSTRAINT items_sku_normalized CHECK (sku = upper(btrim(sku))),
    CONSTRAINT items_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT items_name_trimmed CHECK (name = btrim(name)),
    CONSTRAINT items_category_valid CHECK (
        category IN (
            'raw_material',
            'finished_goods',
            'packaging',
            'spare_part',
            'consumable',
            'equipment'
        )
    ),
    CONSTRAINT items_unit_valid CHECK (
        unit IN ('pcs', 'kg', 'gr', 'ltr', 'box', 'carton', 'pallet')
    )
);

CREATE INDEX items_active_created_at_id_idx
    ON items (created_at DESC, id DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX items_active_category_created_at_id_idx
    ON items (category, created_at DESC, id DESC)
    WHERE deleted_at IS NULL;
