-- Seed user cho môi trường dev. Chỉ được nạp khi chạy profile `dev` (xem application-dev.yml).
-- Mật khẩu KHÔNG nằm trong file này: ${devSeedPasswordHash} là hash BCrypt của biến môi trường
-- DEV_SEED_PASSWORD, được DevSeedFlywayConfig tính lúc khởi động.
-- Chỉ tạo user chưa có (ON CONFLICT DO NOTHING); đổi DEV_SEED_PASSWORD sau đó không đổi mật khẩu user đã tạo.

INSERT INTO users (id, email, username, password_hash, full_name, role, project_key, auth_provider, status) VALUES
    ('aaaa0001-0000-0000-0000-000000000001', 'hc.admin@happycreative.com',       'hc.admin',       '${devSeedPasswordHash}', 'HC Admin',          'ADMIN',          NULL,       'LOCAL', 'ACTIVE'),
    ('aaaa0001-0000-0000-0000-000000000002', 'hc.marvel@happycreative.com',      'hc.marvel',      '${devSeedPasswordHash}', 'Marvel Team',       'MARVEL',         NULL,       'LOCAL', 'ACTIVE'),
    ('bbbb0001-0000-0000-0000-000000000001', 'hc.happy@happycreative.com',       'hc.happy',       '${devSeedPasswordHash}', 'Happy Seller',      'SELLER',         'happy',    'LOCAL', 'ACTIVE'),
    ('bbbb0001-0000-0000-0000-000000000002', 'hc.creative@happycreative.com',    'hc.creative',    '${devSeedPasswordHash}', 'Creative Seller',   'SELLER',         'creative', 'LOCAL', 'ACTIVE'),
    ('bbbb0001-0000-0000-0000-000000000003', 'hc.hapify84@happycreative.com',    'hc.hapify84',    '${devSeedPasswordHash}', 'Hapify84 Seller',   'SELLER',         'hapify84', 'LOCAL', 'ACTIVE'),
    ('bbbb0001-0000-0000-0000-000000000004', 'hc.global@happycreative.com',      'hc.global',      '${devSeedPasswordHash}', 'Global Seller',     'SELLER',         'global',   'LOCAL', 'ACTIVE'),
    ('cccc0001-0000-0000-0000-000000000001', 'hc.pd.happy@happycreative.com',    'hc.pd.happy',    '${devSeedPasswordHash}', 'Happy Designer',    'PRODUCT_DESIGN', 'happy',    'LOCAL', 'ACTIVE'),
    ('cccc0001-0000-0000-0000-000000000002', 'hc.pd.creative@happycreative.com', 'hc.pd.creative', '${devSeedPasswordHash}', 'Creative Designer', 'PRODUCT_DESIGN', 'creative', 'LOCAL', 'ACTIVE'),
    ('cccc0001-0000-0000-0000-000000000003', 'hc.pd.hapify84@happycreative.com', 'hc.pd.hapify84', '${devSeedPasswordHash}', 'Hapify84 Designer', 'PRODUCT_DESIGN', 'hapify84', 'LOCAL', 'ACTIVE'),
    ('cccc0001-0000-0000-0000-000000000004', 'hc.pd.global@happycreative.com',   'hc.pd.global',   '${devSeedPasswordHash}', 'Global Designer',   'PRODUCT_DESIGN', 'global',   'LOCAL', 'ACTIVE')
ON CONFLICT DO NOTHING;
