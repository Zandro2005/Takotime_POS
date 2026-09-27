-- Default seed data for TAKOTIME POS

-- Default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
    ('store_name',          'TAKOTIME - Montalban'),
    ('receipt_header',      'TAKOTIME\nMontalban Branch\nTel: (02) 8123-4567'),
    ('receipt_footer',      'Maraming Salamat!\nCome Again!'),
    ('session_timeout_min', '30'),
    ('sync_interval_min',   '15'),
    ('backup_interval_hrs', '6'),
    ('tax_rate',            '0'),
    ('currency_symbol',     '₱');

-- Default Categories
INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES
    (1, 'Takoyaki', 1),
    (2, 'Siomai', 2),
    (3, 'Drinks', 3);
