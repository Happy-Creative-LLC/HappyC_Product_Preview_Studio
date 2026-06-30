-- ============================================================
--  Happy Creative — Product Preview Tool
--  Database Init Script — PostgreSQL
--  File này chạy tự động khi Docker volume được tạo mới.
--  Dùng VARCHAR thay PostgreSQL ENUM để tương thích với Hibernate.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================
--  TABLES
-- ============================================================

-- role:          ADMIN | MARVEL | SELLER | PRODUCT_DESIGN
-- auth_provider: LOCAL | GOOGLE
-- status:        PENDING | ACTIVE | LOCKED
-- project_key:   happy | creative | hapify84 | global | NULL (Admin/Marvel)
CREATE TABLE users (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    username        VARCHAR(100) UNIQUE,
    password_hash   VARCHAR(255),
    full_name       VARCHAR(255),
    avatar_url      VARCHAR(500),
    role            VARCHAR(50)  NOT NULL DEFAULT 'SELLER'
                        CHECK (role IN ('ADMIN','MARVEL','SELLER','PRODUCT_DESIGN')),
    project_key     VARCHAR(20)  CHECK (project_key IN ('happy','creative','hapify84','global')),
    auth_provider   VARCHAR(10)  NOT NULL DEFAULT 'LOCAL'
                        CHECK (auth_provider IN ('LOCAL','GOOGLE')),
    google_sub      VARCHAR(255) UNIQUE,
    status          VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('PENDING','ACTIVE','LOCKED')),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    key         VARCHAR(20)  NOT NULL UNIQUE
                    CHECK (key IN ('happy','creative','hapify84','global')),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- platform: AMAZON | ETSY
-- category: 1=Clothing | 2=Home&Kitchen Dọc+Zoom | 3=Home&Kitchen Ngang+Zoom
-- status:   PENDING_UPLOADS | IN_REVIEW | APPROVED | REJECTED
CREATE TABLE tasks (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_by  UUID         NOT NULL REFERENCES users(id),
    title       VARCHAR(500) NOT NULL,
    platform    VARCHAR(10)  NOT NULL DEFAULT 'AMAZON'
                    CHECK (platform IN ('AMAZON','ETSY')),
    category    SMALLINT     NOT NULL DEFAULT 1
                    CHECK (category IN (1,2,3)),
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING_UPLOADS'
                    CHECK (status IN ('PENDING_UPLOADS','IN_REVIEW','APPROVED','REJECTED')),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- product_data JSONB:
-- { title, brand, price, description, fabricType, careInstructions, origin,
--   bulletPoints[], images[], videos[], aPlusImages[], colors[], sizes[] }
-- Amazon: tối đa 7 ảnh | Etsy: tối đa 20 ảnh | Cả 2: tối đa 1 video
CREATE TABLE previews (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id      UUID         REFERENCES tasks(id) ON DELETE CASCADE,
    user_id      UUID         NOT NULL REFERENCES users(id),
    platform     VARCHAR(10)  NOT NULL DEFAULT 'AMAZON',
    product_data JSONB,
    status       VARCHAR(15)  NOT NULL DEFAULT 'DRAFT'
                     CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED')),
    version      SMALLINT     NOT NULL DEFAULT 1,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- target_component: IMAGE | VIDEO | TEXT | APLUS | GENERAL
-- IMAGE=vùng đỏ(Design) | VIDEO=vùng tím(Marvel) | TEXT=vùng xanh(Seller)
CREATE TABLE comments (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    preview_id       UUID        NOT NULL REFERENCES previews(id) ON DELETE CASCADE,
    user_id          UUID        NOT NULL REFERENCES users(id),
    content          TEXT        NOT NULL,
    author_role      VARCHAR(50) NOT NULL,
    target_component VARCHAR(10) NOT NULL DEFAULT 'GENERAL'
                         CHECK (target_component IN ('IMAGE','VIDEO','TEXT','APLUS','GENERAL')),
    is_resolved      BOOLEAN     NOT NULL DEFAULT FALSE,
    resolved_by      UUID        REFERENCES users(id),
    resolved_at      TIMESTAMP,
    created_at       TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Cache kết quả tìm kiếm Amazon (RapidAPI), hết hạn sau 24h
CREATE TABLE search_cache (
    id           BIGSERIAL    PRIMARY KEY,
    keyword      VARCHAR(500) NOT NULL UNIQUE,
    results_json JSONB        NOT NULL,
    last_updated TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
--  INDEXES
-- ============================================================

CREATE INDEX idx_users_project_key ON users(project_key);
CREATE INDEX idx_users_status      ON users(status);
CREATE INDEX idx_tasks_project_id  ON tasks(project_id);
CREATE INDEX idx_tasks_status      ON tasks(status);
CREATE INDEX idx_previews_task_id  ON previews(task_id);
CREATE INDEX idx_previews_gin      ON previews USING GIN (product_data);
CREATE INDEX idx_comments_preview  ON comments(preview_id);

-- ============================================================
--  TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated_at    BEFORE UPDATE ON tasks    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_previews_updated_at BEFORE UPDATE ON previews FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
--  SEED DATA
-- ============================================================

INSERT INTO projects (id, key, name) VALUES
    ('11111111-0000-0000-0000-000000000001', 'happy',    'Happy Project'),
    ('11111111-0000-0000-0000-000000000002', 'creative', 'Creative Project'),
    ('11111111-0000-0000-0000-000000000003', 'hapify84', 'Hapify84 Project'),
    ('11111111-0000-0000-0000-000000000004', 'global',   'Global Project');

-- Password mặc định: Happy@2026
-- Hash dưới đây được tạo bằng BCrypt cost=10
-- Để tạo lại: new BCryptPasswordEncoder().encode("Happy@2026")
-- THAY BẰNG HASH THỰC trước khi deploy lên production
INSERT INTO users (id, email, username, password_hash, full_name, role, project_key, status) VALUES
    ('aaaa0001-0000-0000-0000-000000000001', 'happyc.admin@happycreative.com',   'happyc.admin',    '$2a$10$BCRYPT_HASH_REPLACE_ME', 'HC Admin',          'ADMIN',          NULL,       'ACTIVE'),
    ('aaaa0001-0000-0000-0000-000000000002', 'happyc.marvel@happycreative.com',  'happyc.marvel',   '$2a$10$BCRYPT_HASH_REPLACE_ME', 'Marvel Team',       'MARVEL',         NULL,       'ACTIVE'),
    ('bbbb0001-0000-0000-0000-000000000001', 'hc.happy@happycreative.com',       'hc.happy',        '$2a$10$BCRYPT_HASH_REPLACE_ME', 'Happy Seller',      'SELLER',         'happy',    'ACTIVE'),
    ('bbbb0001-0000-0000-0000-000000000002', 'hc.creative@happycreative.com',    'hc.creative',     '$2a$10$BCRYPT_HASH_REPLACE_ME', 'Creative Seller',   'SELLER',         'creative', 'ACTIVE'),
    ('bbbb0001-0000-0000-0000-000000000003', 'hc.hapify84@happycreative.com',    'hc.hapify84',     '$2a$10$BCRYPT_HASH_REPLACE_ME', 'Hapify84 Seller',   'SELLER',         'hapify84', 'ACTIVE'),
    ('bbbb0001-0000-0000-0000-000000000004', 'hc.global@happycreative.com',      'hc.global',       '$2a$10$BCRYPT_HASH_REPLACE_ME', 'Global Seller',     'SELLER',         'global',   'ACTIVE'),
    ('cccc0001-0000-0000-0000-000000000001', 'hc.pd.happy@happycreative.com',    'hc.pd.happy',     '$2a$10$BCRYPT_HASH_REPLACE_ME', 'Happy Designer',    'PRODUCT_DESIGN', 'happy',    'ACTIVE'),
    ('cccc0001-0000-0000-0000-000000000002', 'hc.pd.creative@happycreative.com', 'hc.pd.creative',  '$2a$10$BCRYPT_HASH_REPLACE_ME', 'Creative Designer', 'PRODUCT_DESIGN', 'creative', 'ACTIVE'),
    ('cccc0001-0000-0000-0000-000000000003', 'hc.pd.hapify84@happycreative.com', 'hc.pd.hapify84',  '$2a$10$BCRYPT_HASH_REPLACE_ME', 'Hapify84 Designer', 'PRODUCT_DESIGN', 'hapify84', 'ACTIVE'),
    ('cccc0001-0000-0000-0000-000000000004', 'hc.pd.global@happycreative.com',   'hc.pd.global',    '$2a$10$BCRYPT_HASH_REPLACE_ME', 'Global Designer',   'PRODUCT_DESIGN', 'global',   'ACTIVE');
