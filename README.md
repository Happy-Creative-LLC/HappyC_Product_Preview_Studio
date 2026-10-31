# HappyC Product Preview Studio

Internal tool của **Happy Creative**: xem trước listing sản phẩm trên Amazon và Etsy (giả lập giao diện thật, desktop và mobile) trước khi publish, để các vai trò cùng review và chỉnh nội dung (title, ảnh, video, bullet points, giá...).

Thiết kế UI/UX mới đang được triển khai theo [docs/ui-plan.md](docs/ui-plan.md). Quy ước làm việc với repo nằm ở [CLAUDE.md](CLAUDE.md).

---

## Tech stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 19, Vite, TailwindCSS 3, Zustand, React Router 7, Axios |
| Backend | Spring Boot 4.0.6, Java 21, Spring Security + JWT (jjwt), Spring Data JPA |
| Database | PostgreSQL 15, schema quản lý bằng Flyway |
| File storage | `db` (mặc định, lưu vào Postgres), `r2` (Cloudflare R2), `local` (đĩa) |
| External API | RapidAPI "Real-Time Amazon Data" cho Amazon Search Preview |
| Container | Docker Compose (chỉ chạy Postgres khi dev) |

---

## Chạy local

Yêu cầu: Java 21, Node.js, Docker.

```powershell
# 1. Database (PostgreSQL 15, cổng 5432, user dev / pass dev123, DB productpreview)
docker compose up -d

# 2. Cấu hình: copy .env.example thành .env rồi điền JWT_SECRET (bắt buộc, tối thiểu 64 ký tự).
#    Thiếu JWT_SECRET thì backend không khởi động.
copy .env.example .env

# 3. Backend, cổng 8081. Flyway tự tạo schema khi khởi động.
cd backend
.\mvnw.cmd spring-boot:run

# 4. Frontend, cổng 5173 (proxy /api và /uploads sang backend)
cd frontend
npm install
npm run dev
```

Kiểm tra:

```powershell
cd backend;  .\mvnw.cmd test        # test backend: unit (H2/mock) và tích hợp trên PostgreSQL 15 bằng Testcontainers (cần Docker)
cd frontend; npm run lint; npm run build; npm test
```

Biến môi trường (xem [.env.example](.env.example)): `JWT_SECRET`, `DB_USER`, `DB_PASS`, `SPRING_DATASOURCE_URL`, `RAPIDAPI_AMAZON_KEY`, `RAPIDAPI_AMAZON_HOST`, `GOOGLE_CLIENT_ID`, `STORAGE_PROVIDER` và các biến `R2_*`. `.env` đã được Git bỏ qua.

### Database và migration

- Schema nằm ở `backend/src/main/resources/db/migration` (`V1__baseline_schema.sql`, ...). Hibernate chỉ `validate`, không tự sửa schema.
- Không sửa migration đã chạy; mọi thay đổi schema là một file `V<n>__<mô_tả>.sql` mới.
- DB dev có sẵn từ trước được Flyway baseline ở V1 (`baseline-on-migrate`). DB trống chạy V1.
- Reset DB dev: `docker compose down -v && docker compose up -d`.
- `V2__seed_projects.sql` tạo 4 project (happy, creative, hapify84, global) ở mọi môi trường.
- Seed user dev: chạy backend với profile `dev` và đặt `DEV_SEED_PASSWORD` (từ 8 ký tự, tối đa 72 byte) trong `.env`. Flyway nạp thêm `db/seed-dev` và tạo 10 tài khoản (`hc.admin`, `hc.marvel`, `hc.happy`, `hc.creative`, `hc.hapify84`, `hc.global`, `hc.pd.happy`, `hc.pd.creative`, `hc.pd.hapify84`, `hc.pd.global`), tất cả dùng mật khẩu đó (băm BCrypt lúc khởi động, không nằm trong code). Chỉ tạo user chưa có; muốn đổi mật khẩu thì xoá user rồi khởi động lại.
  ```powershell
  # .env: DEV_SEED_PASSWORD=<mật khẩu dev của bạn>
  cd backend
  $env:SPRING_PROFILES_ACTIVE = 'dev'; .\mvnw.cmd spring-boot:run
  ```
  Không bật profile `dev` ở production.

---

## Cấu trúc repo

```
├── frontend/                 # React + Vite
│   └── src/
│       ├── api/              # Axios instance + JWT interceptor
│       ├── stores/           # Zustand: appStore (session, project, task), productStore (scaffold preview)
│       ├── pages/            # Login, Projects, TaskList, TaskDetail, AmazonPreview, AmazonSearch,
│       │                     # EtsyPreview, AdminUsers
│       ├── components/       # amazon/, etsy/, upload/, shared/ (EditableZone, CommentSection, SidebarLayout...)
│       ├── hooks/, utils/    # useIsMobile, permissions
│       └── styles/           # hc-app.css
├── backend/
│   └── src/main/
│       ├── java/com/happycreative/productpreview/
│       │   ├── controller/   # Auth, Project, Task, Preview, Comment, Amazon, AdminUser, StoredFile
│       │   ├── service/      # Task, Project, Comment, AdminUser, GoogleAuth, AmazonScraper, file storage...
│       │   ├── application/, domain/, infrastructure/   # Preview theo kiến trúc hexagonal
│       │   ├── entity/, repository/, dto/, security/, config/, exception/
│       └── resources/
│           ├── application.yml
│           └── db/migration/ # Flyway
├── docs/                     # ui-plan.md và tài liệu thiết kế
├── docker-compose.yml        # PostgreSQL cho dev
└── .env.example
```

---

## Phân quyền

Role trả về từ backend viết hoa: `ADMIN`, `MARVEL`, `SELLER`, `PRODUCT_DESIGN`.

| Role | Project | Task | Vùng chỉnh sửa trên Preview |
|------|---------|------|------------------------------|
| `ADMIN` | Xem tất cả | Tạo, sửa | Tất cả |
| `MARVEL` | Xem tất cả | Chỉ xem | Video (vùng tím) |
| `SELLER` | Chỉ project của mình | Tạo, sửa trong project của mình | Text (vùng xanh lá) |
| `PRODUCT_DESIGN` | Chỉ project của mình | Chỉ xem | Ảnh và A+ (vùng đỏ) |

`SELLER` và `PRODUCT_DESIGN` gắn với một `projectKey` (`happy`, `creative`, `hapify84`, `global`). Mọi role đều comment được. Amazon Search Preview chỉ dành cho `ADMIN` và `SELLER`.

---

## Luồng chính

```
Đăng nhập (Google hoặc tài khoản nội bộ) → Chọn project → Danh sách task → Chi tiết task
  → Tải ảnh/video/nội dung → Xem Preview (Amazon hoặc Etsy, desktop + mobile)
  → Comment, gửi review → (Tuỳ chọn) Amazon Search Preview
```

Amazon có 3 layout theo `category` của task: Case 1 Clothing (thumbnail dọc, không zoom), Case 2 Home & Kitchen (thumbnail dọc + zoom), Case 3 Home & Kitchen (thumbnail ngang + zoom). Etsy: tối đa 20 ảnh và 1 video.

---

## API

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập tài khoản nội bộ, nhận JWT |
| POST | `/api/auth/google` | Xác minh Google ID token, đối chiếu email Admin đã cấp phép, nhận JWT |
| GET | `/api/projects` | Danh sách project theo role |
| GET / POST | `/api/projects/{id}/tasks` | Danh sách task / tạo task |
| GET / PUT | `/api/tasks/{id}` | Xem / cập nhật task |
| POST | `/api/previews/upload` | Tạo preview từ file upload (multipart, kèm `taskId`) |
| POST | `/api/previews/import` | Tạo preview từ ASIN Amazon |
| GET | `/api/previews/{id}` | Lấy preview |
| GET / POST | `/api/previews/{id}/comments` | Danh sách / thêm comment |
| PUT | `/api/comments/{id}/resolve` | Đánh dấu comment đã xử lý |
| GET | `/api/amazon/search?keyword=` | Tìm Amazon thật (cache, làm mới nền Chủ nhật) |
| GET / POST / PUT | `/api/admin/users`, `/api/admin/users/{id}` | Quản lý nhân sự (Admin) |
| GET | `/uploads/**` | Phục vụ file media đã lưu |

### Amazon Search

Backend chỉ trả dữ liệu thật từ RapidAPI. Kết quả luôn được phục vụ từ cache; job nền làm mới từ khoá cũ vào Chủ nhật (`SEARCH_CACHE_MAX_AGE_DAYS`, mặc định 15 ngày). Từ khoá chưa có cache hoặc bấm "Cập nhật từ Amazon" mới gọi RapidAPI. Thiếu `RAPIDAPI_AMAZON_KEY` thì API trả `503` bằng tiếng Việt; hệ thống không bao giờ chèn dữ liệu giả.

---

## Deploy (Hostinger VPS)

Docker Compose (backend + PostgreSQL) + Nginx (serve bản build React và reverse proxy `/api`, `/uploads`).

Checklist trước go-live:
- [ ] `JWT_SECRET` thật, tối thiểu 64 ký tự, chỉ đặt qua biến môi trường
- [ ] CORS chỉ cho phép domain production (`app.cors.allowed-origin-patterns`)
- [ ] HTTPS toàn bộ, HTTP redirect sang HTTPS
- [ ] PostgreSQL backup tự động (cron + `pg_dump`)
- [ ] `RAPIDAPI_AMAZON_KEY` và các secret khác trong biến môi trường
- [ ] R2 dùng token giới hạn đúng bucket và custom domain production khi bật `STORAGE_PROVIDER=r2`
- [ ] Đổi hoặc vô hiệu hoá mọi tài khoản seed trước khi mở cho người dùng
- [ ] Trang responsive từ 375px, test từng role trên desktop và mobile

---

## Liên hệ

**Happy Creative Technical**: happyc.technical@gmail.com
