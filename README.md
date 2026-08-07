# HappyC Product Preview Studio

Internal tool cho **Happy Creative** — xem trước giao diện listing sản phẩm trên Amazon và Etsy trước khi publish chính thức.

---

## Mục tiêu

Trước khi đăng sản phẩm lên Amazon / Etsy, các project muốn xem thử listing trông như thế nào trên trang thật (preview giả lập giao diện), từ đó review và chỉnh sửa nội dung (title, ảnh, bullet points, giá...) mà không cần publish thử.

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 19, Vite, TailwindCSS 3, Zustand, React Router v7, Axios |
| Backend | Spring Boot 4 (Java 21), Spring Security, JWT |
| Database | PostgreSQL 15 |
| File storage | Provider abstraction, sẵn sàng sử dụng Cloudflare R2 |
| External API | RapidAPI (scrape Amazon search results) |
| Container | Docker + Docker Compose |

---

## Cấu trúc dự án

```
amazon_product_preview/
├── frontend/          # React + Vite
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
├── backend/           # Spring Boot
│   └── src/main/java/com/happycreative/productpreview/
│       ├── controller/    # Auth, Preview, Amazon, Comment, Project*, Task*
│       ├── service/       # PreviewService, AmazonScraperService, FileStorageService
│       ├── entity/        # User, Project, Task, Preview, Comment, SearchCache
│       ├── repository/    # JPA repositories
│       ├── security/      # JWT, CustomUserDetails
│       ├── config/        # CORS, SecurityConfig, StorageProperties, R2StorageConfig
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

## API chính

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập, nhận JWT |
| POST | `/api/auth/google` | Xác minh Google ID token, đối chiếu email được Admin cấp phép và nhận JWT |
| GET | `/api/projects` | Danh sách project theo role |
| GET | `/api/projects/{id}/tasks` | Danh sách task |
| POST | `/api/projects/{id}/tasks` | Tạo task mới |
| POST | `/api/previews/upload` | Tạo preview từ file upload |
| POST | `/api/previews/import` | Tạo preview từ ASIN Amazon |
| GET | `/api/previews/{id}` | Lấy preview theo ID |
| GET | `/api/amazon/search?keyword=` | Tìm kiếm Amazon thật (có cache) |
| GET | `/api/admin/users` | Danh sách nhân sự (Admin only) |
| PUT | `/api/admin/users/{id}` | Cập nhật role / projectKey / status |

### Cấu hình Amazon Search

Backend chỉ trả dữ liệu thật từ RapidAPI và cache theo keyword tối đa 24 giờ. Trước khi chạy backend, cấu hình:

```powershell
$env:RAPIDAPI_AMAZON_KEY='your-key'
# Tuỳ chọn khi đổi nhà cung cấp/host:
$env:RAPIDAPI_AMAZON_HOST='real-time-amazon-data.p.rapidapi.com'
```

Hoặc copy `.env.example` thành `.env` tại thư mục gốc rồi điền `RAPIDAPI_AMAZON_KEY`. Backend tự đọc file này khi chạy từ thư mục gốc hoặc `backend/`; `.env` đã được Git bỏ qua để tránh lộ secret.

Nếu thiếu key, API trả lỗi `503` bằng tiếng Việt; hệ thống không tự chèn dữ liệu mock vào trang so sánh.

---

## Database Schema (tóm tắt)

| Bảng | Mô tả |
|------|-------|
| `users` | Nhân sự — role, projectKey, phương thức xác thực và trạng thái truy cập |
| `projects` | 4 project: happy, creative, hapify84, global |
| `tasks` | Task trong project — platform (AMAZON/ETSY), category, layout_case |
| `previews` | Dữ liệu preview — product_data (JSONB): title, price, images, bulletPoints... |
| `comments` | Bình luận gắn với từng thành phần trong preview |
| `search_cache` | Cache kết quả scrape Amazon theo keyword |

Chi tiết xem tại [database/init.sql](database/init.sql) và [database/ERD.md](database/ERD.md).

---

## Roadmap

| Phase | Nội dung | Tuần |
|-------|----------|------|
| Phase 1 | Backend integration — Project/Task API, Auth JWT, Upload kết nối DB | 1–2 |
| Phase 1B | Google OAuth + Admin quản lý nhân sự | 2–3 |
| Phase 2 | Amazon 3 Cases hoàn chỉnh, Etsy 20 ảnh + video, Permission zones UI, Comment | 3–7 |
| Phase 3 | Mobile responsive — Carousel, pinch-to-zoom, bottom tab bar, step wizard upload | 8–11 |
| Phase 4 | Docker production, config môi trường, backup PostgreSQL | 12 |
| Phase 5 | Deploy Hostinger VPS, DNS + SSL (Certbot), UAT toàn hệ thống | 13 |

---

## Deploy (Production — Hostinger VPS)

**Stack:** Docker + Docker Compose (backend + PostgreSQL) + Nginx (serve React build + reverse proxy).

```nginx
location /          → /var/www/frontend/dist  (React static)
location /api/      → http://backend:8081       (Spring Boot service)
```

**Checklist trước go-live:**
- [ ] Tất cả API đã kết nối, không còn mock data
- [ ] JWT secret >= 256 bit, không hardcode trong code
- [ ] CORS chỉ cho phép domain production
- [ ] HTTPS toàn bộ (HTTP redirect → HTTPS)
- [ ] PostgreSQL backup tự động (cron + pg_dump)
- [ ] RapidAPI key trong biến môi trường
- [ ] R2 dùng token giới hạn đúng bucket và custom domain production (khi bật `STORAGE_PROVIDER=r2`)
- [ ] Tất cả trang responsive >= 375px (iPhone SE)
- [ ] Test từng role trên mobile + desktop

---

## Liên hệ

**Happy Creative Technical** — happyc.technical@gmail.com
