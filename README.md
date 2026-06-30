# Amazon Product Preview

Internal tool cho team **Happy Creative** — xem trước giao diện listing sản phẩm trên Amazon và Etsy trước khi publish chính thức.

---

## Mục tiêu

Trước khi đăng sản phẩm lên Amazon / Etsy, team muốn xem thử listing trông như thế nào trên trang thật (preview giả lập giao diện), từ đó review và chỉnh sửa nội dung (title, ảnh, bullet points, giá...) mà không cần publish thử.

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 19, Vite, TailwindCSS 3, Zustand, React Router v7, Axios |
| Backend | Spring Boot 4 (Java 25), Spring Security, JWT |
| Database | PostgreSQL 15 |
| File storage | Local disk (`backend/uploads/`) — Cloudinary sẵn sàng tích hợp |
| External API | RapidAPI (scrape Amazon search results) |
| Container | Docker + Docker Compose |

---

## Cấu trúc dự án

```
amazon_product_preview/
├── frontend/          # React + Vite (port 5174)
│   └── src/
│       ├── api/           # Axios instance + JWT interceptor
│       ├── stores/        # Zustand stores (app state, product state)
│       ├── pages/         # LoginPage, ProjectsPage, TaskListPage, TaskDetailPage,
│       │                  # AmazonPreviewPage, AmazonSearchPage, EtsyPreviewPage
│       └── components/
│           ├── amazon/    # Header, ProductGallery, ProductInfo, BuyBox, 3 Cases
│           ├── etsy/      # EtsyHeader, EtsyGallery, EtsyInfo, EtsyShopInfo
│           ├── upload/    # AmazonUploadForm
│           ├── layout/    # Layout wrappers
│           └── shared/    # ControlPanel, CommentSection, EditableZone
├── backend/           # Spring Boot (port 8081)
│   └── src/main/java/com/happycreative/productpreview/
│       ├── controller/    # Auth, Preview, Amazon, Comment, Project*, Task*
│       ├── service/       # PreviewService, AmazonScraperService, FileStorageService
│       ├── entity/        # User, Project, Task, Preview, Comment, SearchCache
│       ├── repository/    # JPA repositories
│       ├── security/      # JWT, CustomUserDetails
│       ├── config/        # CORS, SecurityConfig, CloudinaryConfig
│       └── dto/           # AuthRequest, AuthResponse
├── database/
│   ├── init.sql           # Schema đầy đủ + seed data (chạy 1 lần trên DB trống)
│   └── ERD.md             # Sơ đồ quan hệ (Mermaid)
└── docker-compose.yml     # PostgreSQL container
```

---

## Hệ thống phân quyền

| Role | Quyền |
|------|-------|
| `Admin` | Toàn quyền, xem tất cả project |
| `Marvel` | Xem tất cả project, có thể edit |
| `Seller` | Chỉ xem project của mình, có thể tạo task |
| `Product Design` | Chỉ xem project của mình, không tạo task |

Mỗi `Seller` và `Product Design` gắn với một `projectKey` cụ thể: `happy`, `creative`, `hapify84`, hoặc `global`.

### Phân quyền chỉnh sửa theo màu viền trên Preview UI

| Màu | Nhóm | Quyền |
|-----|------|-------|
| Đỏ | Product Design | Upload / chỉnh sửa / xoá **ảnh** |
| Tím | Marvel | Upload / chỉnh sửa / xoá **video** |
| Xanh lá | Seller | Upload / chỉnh sửa / xoá **text** |

Tất cả role đều có thể **comment** vào bất kỳ thành phần nào.

---

## Luồng hoạt động chính

```
Login → Chọn Project → Danh sách Task → Task Detail
  → Chọn Platform (Amazon / Etsy) + Category + Layout Case
  → Upload ảnh / video / nội dung
  → Nhấn "Preview Product"
  → Xem giả lập trang Amazon hoặc Etsy (Desktop + Mobile)
  → (Tuỳ chọn) Xem "Search Preview" — giả lập trang tìm kiếm Amazon
```

---

## Amazon Preview — 3 Layout Cases

| Case | Danh mục | Gallery | Zoom |
|------|----------|---------|------|
| Case 1 | Clothing | Thumbnail dọc | Không |
| Case 2 | Home & Kitchen | Thumbnail dọc | Có (hover) |
| Case 3 | Home & Kitchen | Thumbnail ngang | Có (hover) |

Mỗi case hỗ trợ tối đa **7 ảnh** hoặc **6 ảnh + 1 video**.

---

## Cài đặt và chạy local

### Yêu cầu
- Node.js 20+
- Java 25, Maven
- Docker Desktop

### 1. Khởi động Database

```bash
docker compose up -d
```

Database PostgreSQL sẽ chạy ở `localhost:5432`, schema được tự động import từ `database/init.sql`.

### 2. Chạy Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend chạy ở `http://localhost:8081`.

### 3. Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy ở `http://localhost:5174`.

---

## Biến môi trường

### Backend (`backend/src/main/resources/application.properties`)

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/productpreview
spring.datasource.username=dev
spring.datasource.password=dev123

jwt.secret=<chuỗi >= 256 bit>
jwt.expiration=86400000

rapidapi.key=<RapidAPI key>
rapidapi.host=real-time-amazon-data.p.rapidapi.com

app.base-url=http://localhost:8081
app.upload-dir=uploads/
```

### Frontend (`frontend/.env.local`)

```env
VITE_API_BASE_URL=http://localhost:8081
```

---

## API chính

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập, nhận JWT |
| GET | `/api/projects` | Danh sách project theo role |
| GET | `/api/projects/{id}/tasks` | Danh sách task |
| POST | `/api/projects/{id}/tasks` | Tạo task mới |
| POST | `/api/previews/upload` | Tạo preview từ file upload |
| POST | `/api/previews/import` | Tạo preview từ ASIN Amazon |
| GET | `/api/previews/{id}` | Lấy preview theo ID |
| GET | `/api/amazon/search?keyword=` | Tìm kiếm Amazon thật (có cache) |
| GET | `/api/admin/users` | Danh sách nhân sự (Admin only) |
| PUT | `/api/admin/users/{id}` | Cập nhật role / projectKey / status |

---

## Database Schema (tóm tắt)

| Bảng | Mô tả |
|------|-------|
| `users` | Tài khoản — role, projectKey, auth_provider (LOCAL/GOOGLE), status (PENDING/ACTIVE/LOCKED) |
| `projects` | 4 project: happy, creative, hapify84, global |
| `tasks` | Task trong project — platform (AMAZON/ETSY), category, layout_case |
| `previews` | Dữ liệu preview — product_data (JSONB): title, price, images, bulletPoints... |
| `comments` | Bình luận gắn với từng thành phần trong preview |
| `search_cache` | Cache kết quả scrape Amazon theo keyword |

Chi tiết xem tại [database/init.sql](database/init.sql) và [database/ERD.md](database/ERD.md).

---

## Tài khoản test (mock, chỉ dùng local)

> Các tài khoản mock này chỉ hoạt động khi backend chưa kết nối. Sẽ bị xóa trước khi deploy.

| Username | Password | Role | Project |
|----------|----------|------|---------|
| `happyc.admin` | `123456` | Admin | Tất cả |
| `happyc.marvel` | `123456` | Marvel | Tất cả |
| `happyc.seller.happy` | `123456` | Seller | happy |
| `happyc.pd.happy` | `123456` | Product Design | happy |

---

## Roadmap

| Phase | Nội dung | Tuần |
|-------|----------|------|
| Phase 1 | Backend integration — Project/Task API, Auth JWT, Upload kết nối DB | 1–2 |
| Phase 1B | Google OAuth + Admin quản lý nhân sự | 2–3 |
| Phase 2 | Amazon 3 Cases hoàn chỉnh, Etsy 20 ảnh + video, Permission zones UI, Comment | 3–7 |
| Phase 3 | Mobile responsive — Carousel, pinch-to-zoom, bottom tab bar, step wizard upload | 8–11 |
| Phase 4 | Docker production, config môi trường, backup PostgreSQL | 12 |
| Phase 5 | Deploy Hostinger VPS, DNS + SSL (Certbot), UAT toàn team | 13 |

---

## Deploy (Production — Hostinger VPS)

**Stack:** Docker + Docker Compose (backend + PostgreSQL) + Nginx (serve React build + reverse proxy).

```nginx
location /          → /var/www/frontend/dist  (React static)
location /api/      → http://localhost:8081    (Spring Boot)
location /uploads/  → /var/data/uploads/       (file media, cache 30d)
```

**Checklist trước go-live:**
- [ ] Tất cả API đã kết nối, không còn mock data
- [ ] JWT secret >= 256 bit, không hardcode trong code
- [ ] CORS chỉ cho phép domain production
- [ ] HTTPS toàn bộ (HTTP redirect → HTTPS)
- [ ] PostgreSQL backup tự động (cron + pg_dump)
- [ ] RapidAPI key trong biến môi trường
- [ ] Tất cả trang responsive >= 375px (iPhone SE)
- [ ] Test từng role trên mobile + desktop

---

## Liên hệ

**Happy Creative Technical Team** — happyc.technical@gmail.com
