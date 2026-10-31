-- V2: 4 project cố định của hệ thống (dữ liệu tham chiếu, chạy ở mọi môi trường).
-- Bỏ qua nếu project đã tồn tại (DB cũ đã có sẵn dữ liệu).

INSERT INTO projects (id, project_key, name) VALUES
    ('11111111-0000-0000-0000-000000000001', 'happy',    'Happy Project'),
    ('11111111-0000-0000-0000-000000000002', 'creative', 'Creative Project'),
    ('11111111-0000-0000-0000-000000000003', 'hapify84', 'Hapify84 Project'),
    ('11111111-0000-0000-0000-000000000004', 'global',   'Global Project')
ON CONFLICT DO NOTHING;
