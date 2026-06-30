# ERD — Happy Creative Product Preview Tool

## Sơ đồ quan hệ (Mermaid)

```mermaid
erDiagram

    %% ─── USERS ───────────────────────────────────────────
    USERS {
        UUID        id              PK
        VARCHAR     email           UK  "NOT NULL"
        VARCHAR     username        UK
        VARCHAR     password_hash       "NULL nếu Google login"
        VARCHAR     full_name
        VARCHAR     avatar_url
        ENUM        role                "ADMIN|MARVEL|SELLER|PRODUCT_DESIGN"
        ENUM        project_key         "happy|creative|hapify84|global — NULL nếu ADMIN/MARVEL"
        ENUM        auth_provider       "LOCAL|GOOGLE"
        VARCHAR     google_sub      UK  "Google sub ID"
        ENUM        status              "PENDING|ACTIVE|LOCKED"
        TIMESTAMP   created_at
        TIMESTAMP   updated_at
    }

    %% ─── PROJECTS ────────────────────────────────────────
    PROJECTS {
        UUID        id          PK
        ENUM        key         UK  "happy|creative|hapify84|global"
        VARCHAR     name
        TEXT        description
        BOOLEAN     is_active
        TIMESTAMP   created_at
    }

    %% ─── TASKS ───────────────────────────────────────────
    TASKS {
        UUID        id          PK
        UUID        project_id  FK
        UUID        created_by  FK  "users.id"
        VARCHAR     title
        ENUM        platform        "AMAZON|ETSY"
        SMALLINT    category        "1=Clothing 2=HK-Dọc 3=HK-Ngang"
        ENUM        status          "PENDING_UPLOADS|IN_REVIEW|APPROVED|REJECTED"
        TIMESTAMP   created_at
        TIMESTAMP   updated_at
    }

    %% ─── PREVIEWS ────────────────────────────────────────
    PREVIEWS {
        UUID        id          PK
        UUID        task_id     FK
        UUID        user_id     FK
        ENUM        platform        "AMAZON|ETSY"
        JSONB       product_data    "title,brand,price,images[],videos[],bulletPoints[],..."
        ENUM        status          "DRAFT|SUBMITTED|APPROVED|REJECTED"
        SMALLINT    version
        TIMESTAMP   created_at
        TIMESTAMP   updated_at
    }

    %% ─── COMMENTS ────────────────────────────────────────
    COMMENTS {
        UUID        id                  PK
        UUID        preview_id          FK
        UUID        user_id             FK
        TEXT        content
        VARCHAR     author_role             "snapshot role tại thời điểm comment"
        ENUM        target_component        "IMAGE|VIDEO|TEXT|APLUS|GENERAL"
        BOOLEAN     is_resolved
        UUID        resolved_by         FK  "users.id — nullable"
        TIMESTAMP   resolved_at
        TIMESTAMP   created_at
    }

    %% ─── SEARCH_CACHE ────────────────────────────────────
    SEARCH_CACHE {
        BIGSERIAL   id          PK
        VARCHAR     keyword     UK
        JSONB       results_json    "[{asin,title,price,rating,imageUrl,...}]"
        TIMESTAMP   last_updated
    }

    %% ─── RELATIONSHIPS ───────────────────────────────────

    PROJECTS    ||--o{ TASKS      : "có nhiều"
    USERS       ||--o{ TASKS      : "tạo bởi"
    TASKS       ||--o| PREVIEWS   : "có 1 preview"
    USERS       ||--o{ PREVIEWS   : "upload bởi"
    PREVIEWS    ||--o{ COMMENTS   : "có nhiều"
    USERS       ||--o{ COMMENTS   : "viết bởi"
    USERS       ||--o{ COMMENTS   : "duyệt bởi (resolved_by)"
```

---

## Quan hệ chi tiết

| Quan hệ | Loại | Mô tả |
|---------|------|-------|
| `PROJECTS` → `TASKS` | 1 : N | Một project có nhiều task |
| `USERS` → `TASKS` | 1 : N | Một user (Seller/Admin) tạo nhiều task |
| `TASKS` → `PREVIEWS` | 1 : 1 | Một task có đúng 1 preview (version mới nhất) |
| `USERS` → `PREVIEWS` | 1 : N | Một user có thể tạo nhiều preview (các lần update) |
| `PREVIEWS` → `COMMENTS` | 1 : N | Một preview có nhiều comment |
| `USERS` → `COMMENTS` | 1 : N | Một user viết nhiều comment |

---

## Phân quyền theo dữ liệu

```
ADMIN
  └── Thấy tất cả PROJECTS → TASKS → PREVIEWS → COMMENTS

MARVEL
  └── Thấy tất cả PROJECTS → TASKS → PREVIEWS → COMMENTS
  └── Chỉ edit vùng VIDEO (target_component = VIDEO)

SELLER (project_key = 'happy')
  └── PROJECTS.key = 'happy' → TASKS của project đó
  └── Edit vùng TEXT (target_component = TEXT)
  └── Comment vào mọi thành phần

PRODUCT_DESIGN (project_key = 'creative')
  └── PROJECTS.key = 'creative' → TASKS của project đó
  └── Edit vùng IMAGE, APLUS (target_component = IMAGE | APLUS)
  └── Comment vào mọi thành phần
  └── Không tạo được TASKS mới
```

---

## Cấu trúc JSONB — product_data

```json
{
  "title":            "Hanes Men's Undershirts (3-Pack)",
  "brand":            "Hanes",
  "price":            14.99,
  "description":      "Mô tả sản phẩm đầy đủ...",
  "fabricType":       "100% Cotton",
  "careInstructions": "Machine wash cold, tumble dry low",
  "origin":           "Imported",
  "bulletPoints": [
    "Tagless design for itch-free comfort",
    "Ribbed fabric for durability",
    "Classic crew neck style"
  ],
  "images":    ["https://cdn.../img1.jpg", "https://cdn.../img2.jpg"],
  "videos":    ["https://cdn.../demo.mp4"],
  "aPlusImages": ["https://cdn.../aplus1.jpg"],
  "colors":    ["White", "Black", "Gray"],
  "sizes":     ["S", "M", "L", "XL", "2XL"]
}
```

**Giới hạn media:**
| Platform | Ảnh tối đa | Video tối đa |
|----------|-----------|-------------|
| Amazon   | 7         | 1           |
| Etsy     | 20        | 1           |

---

## Cấu trúc JSONB — search_cache.results_json

```json
[
  {
    "asin":        "B01234ABCD",
    "title":       "Competitor Product Title",
    "price":       "19.99",
    "rating":      4.5,
    "reviewCount": 1234,
    "imageUrl":    "https://m.media-amazon.com/...",
    "productUrl":  "https://www.amazon.com/dp/B01234ABCD"
  }
]
```

Cache hết hạn sau **24 giờ** — `PreviewCleanupService` xóa các record `last_updated < NOW() - INTERVAL '24 hours'`.

---

## Cách dùng

```bash
# Chạy 1 lần để khởi tạo toàn bộ DB từ đầu
psql -U dev -d productpreview -f database/init.sql
```
