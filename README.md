# HappyC Product Preview Studio

Internal tool của **Happy Creative**: xem trước listing sản phẩm trên Amazon và Etsy (giả lập giao diện thật, desktop và mobile) trước khi publish, để các vai trò cùng review và chỉnh nội dung (title, ảnh, video, bullet points, giá...).

Thiết kế UI/UX mới đang được triển khai theo [docs/ui-plan.md](docs/ui-plan.md). Quy ước làm việc với repo nằm ở [CLAUDE.md](CLAUDE.md).

---

## Tech stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 19, Vite, TailwindCSS 4, Zustand, React Router 7, Axios |
| Backend | Spring Boot 4.0.6, Java 21, Spring Security + JWT (jjwt), Spring Data JPA |
| Database | PostgreSQL 15, schema quản lý bằng Flyway |
| File storage | `db` (mặc định, lưu vào Postgres), `r2` (Cloudflare R2), `local` (đĩa) |
| External API | SerpApi Amazon Search + Product (mặc định gói Free) |
| Container | Docker Compose (chỉ chạy Postgres khi dev) |

---

## Chạy local

Yêu cầu môi trường:

- Java 21
- Node.js 24 trở lên: phiên bản ghim ở [frontend/.nvmrc](frontend/.nvmrc) (CI đọc đúng file này) và trường `engines` trong `frontend/package.json`. Dùng nvm/fnm thì chạy `nvm use` hoặc `fnm use` trong `frontend/`.
- Docker (Postgres dev và test tích hợp bằng Testcontainers)

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

### CI (GitHub Actions)

Workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) chạy khi mở hoặc cập nhật PR vào `main`, khi push vào `main` và khi chạy tay (`workflow_dispatch`). Mỗi ref chỉ giữ một run: push mới vào cùng nhánh hủy run cũ. Token chỉ có `contents: read`; workflow không deploy, không push image và không cần secret.

- **Backend (Maven test):** Temurin 21, `./mvnw -B test` trong `backend/`. Test tích hợp dùng Testcontainers PostgreSQL 15 trên Docker có sẵn của runner. Fail thì upload báo cáo surefire (artifact `surefire-reports`, giữ 7 ngày).
- **Frontend (lint, build, test):** Node đọc từ `frontend/.nvmrc` (hiện là 24), `npm ci`, `npm run lint`, `npm run build`, `npm test` trong `frontend/`.

Cả hai job phải xanh trước khi merge PR vào `main`; đây là bản chạy lại đúng các lệnh ở mục "Kiểm tra" trên một máy sạch. Muốn GitHub chặn merge khi CI đỏ, đặt hai job trên làm required status check trong branch protection của `main` (cài đặt repo, không nằm trong code).

Dependabot ([.github/dependabot.yml](.github/dependabot.yml)) mở PR cập nhật dependency hằng tuần cho `backend` (Maven), `frontend` (npm) và GitHub Actions, gom bản minor và patch thành một PR cho mỗi nhóm. PR của Dependabot cũng phải qua CI.

Biến môi trường (xem [.env.example](.env.example)): `JWT_SECRET`, `DB_USER`, `DB_PASS`, `SPRING_DATASOURCE_URL`, `SERPAPI_API_KEY`, `SERPAPI_FREE_ONLY`, `GOOGLE_CLIENT_ID`, `STORAGE_PROVIDER` và các biến `R2_*`. `.env` đã được Git bỏ qua.

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
├── .github/                  # CI (workflows/ci.yml) và dependabot.yml
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
| GET | `/api/amazon/search?keyword=` | Tìm Amazon thật qua SerpApi, ưu tiên cache và giữ quota Free |
| GET | `/api/amazon/product?asin=&device=` | Lấy dữ liệu trang sản phẩm Amazon theo ASIN, cache theo thiết bị |
| GET / POST / PUT | `/api/admin/users`, `/api/admin/users/{id}` | Quản lý nhân sự (Admin) |
| GET | `/uploads/**` | Phục vụ file media đã lưu |

### Amazon Search

Amazon Search dùng [SerpApi Amazon Search API](https://serpapi.com/amazon-search-api). Cấu hình mặc định dành cho giai đoạn thử nghiệm miễn phí:

1. Tạo tài khoản [SerpApi Free](https://serpapi.com/pricing), lấy key ở dashboard và thêm `SERPAPI_API_KEY` vào `.env` phía backend. Không đưa key vào frontend hoặc commit Git.
2. Giữ `SERPAPI_FREE_ONLY=true`. Trước mỗi truy vấn mới, backend gọi [Account API miễn phí](https://serpapi.com/account-api) để kiểm tra gói có giá $0 và số lượt trong gói còn lại. Không dùng extra credits khi đã hết lượt miễn phí. Việc nâng gói phải do người quản trị thực hiện riêng.
3. Gói Free được công bố ngày 10/11/2026 có 250 lượt/tháng, 50 lượt/giờ. Quota dùng chung cho cả team/API key, không phải cho từng user. Số lượt thực tế theo tài khoản SerpApi.
4. Mở Search Preview chỉ gợi ý từ khoá từ listing; bấm tìm kiếm/Enter mới gửi yêu cầu. Kết quả được lưu Postgres và dùng lại cho mọi role được phép, kể cả dữ liệu cũ. Từ khoá được chuẩn hoá chữ thường và khoảng trắng. Kết quả rỗng hợp lệ cũng được cache.
5. Cập nhật cùng từ khoá cách nhau tối thiểu 60 phút (`SEARCH_CACHE_MIN_REFRESH_MINUTES`); request trùng từ khoá được gộp tại một backend instance. Mỗi instance chỉ xử lý một truy vấn provider tại một thời điểm để tránh tranh quota cuối cùng. Hết quota/lỗi provider khi refresh thì giữ kết quả cũ.
6. Job tự làm mới nền mặc định tắt (`SEARCH_CACHE_REFRESH_ENABLED=false`). Ngưỡng `SEARCH_CACHE_MAX_AGE_DAYS=15` chỉ đánh dấu dữ liệu cũ; giao diện hiển thị thời điểm lấy dữ liệu thật, không cam kết cache 24 giờ.
7. Search hiện lấy trang 1 của `amazon.com`, tiếng Anh, ZIP `10001`, dữ liệu desktop dùng chung cho bố cục desktop/mobile; không truy vấn thêm chỉ vì đổi kích thước màn hình. Giữ thứ tự thẻ của `organic_results` (bao gồm thẻ có cờ sponsored); chưa dựng các khối quảng cáo thương hiệu/video riêng.

### Amazon Product API — tham chiếu và áp dụng vào task

Product API dùng SerpApi `amazon_product` để lấy dữ liệu trang sản phẩm Amazon theo ASIN. Frontend dùng cùng bộ dựng Amazon nội bộ để hiển thị dữ liệu theo bố cục responsive; API cung cấp dữ liệu sản phẩm, không trả về ảnh chụp hay HTML nguyên trang của Amazon.

- `GET /api/amazon/product?asin={ASIN}&device=desktop|mobile|tablet` lấy thông tin sản phẩm. `device` mặc định là `desktop`; giao diện nội bộ luôn dùng dữ liệu desktop và tự co giãn trên mobile để tránh tạo cache/API request riêng chỉ do đổi kích thước màn hình.
- Trên trang Amazon Preview, nút **Product API** mở công cụ cho `ADMIN` và `SELLER`. Nhập ASIN hoặc URL Amazon hợp lệ để tải tham chiếu.
- **Xem trên trang preview** chỉ thay dữ liệu đang hiển thị trong phiên hiện tại. **Áp dụng vào task** là thao tác riêng, gọi `POST /api/previews/import` để lưu dữ liệu vào preview của task đang mở. Không tự lưu khi tải tham chiếu.
- Kết quả được cache trong bảng `search_cache` theo ASIN và loại thiết bị. Mặc định dùng cache trong 24 giờ; nếu lần gọi mới lỗi hoặc hết quota thì trả cache cũ nếu có. Product API và Amazon Search cùng dùng quota của một key SerpApi Free.
- Cấu hình key chỉ ở backend qua `SERPAPI_API_KEY`; bật giới hạn gói Free bằng `SERPAPI_FREE_ONLY=true`. Không đưa key vào frontend, response, log hoặc Git. Chạy kiểm tra mặc định bằng HTTP giả lập để không tiêu quota; chỉ bật smoke test live khi chủ động chấp nhận một lượt gọi thật.

Response JSON giữ các trường sản phẩm có thể lấy được như `asin`, `title`, `brand`, `price`, `oldPrice`, `rating`, `reviewsCount`, `images`, `bulletPoints`, `description`, `colors`, `sizes`, `fabricType`, `careInstructions` và `origin`. Các trường thiếu trên trang nguồn sẽ không được bịa thêm. Header `X-Product-Source` cho biết `serpapi` hay `cache`, `X-Product-Stale` cho biết cache đã cũ được dùng dự phòng, `X-Product-Device` cho biết biến thể thiết bị được yêu cầu.

Contract `GET /api/amazon/search?keyword=&forceRefresh=false` vẫn trả mảng sản phẩm. Các trường tuỳ chọn mới: `position`, `promotion`, `deliveryTime`, `demo`. Metadata nằm ở header `X-Search-Source` (`cache`/`serpapi`/`demo`), `X-Search-Fetched-At` (UTC ISO-8601), `X-Search-Stale`, `X-Search-Notice` (`REFRESH_COOLDOWN`, `QUOTA_LIMIT`, `REFRESH_FAILED`, `EMPTY_REFRESH`). Khi hết quota hoặc API không khả dụng: ưu tiên cache thật; nếu chưa có cache, trả dữ liệu mẫu (`source=demo`, `notice=DEMO_QUOTA_LIMIT` hoặc `DEMO_UNAVAILABLE`) để tiếp tục thử bố cục. Dữ liệu mẫu không phải đối thủ theo từ khoá, được gắn nhãn trên banner/từng thẻ và không bao giờ lưu vào cache thật. Provider có cooldown 60 giây sau lỗi, tránh gọi lại liên tục; mọi thông báo bằng tiếng Việt.

Test mặc định dùng HTTP giả lập, không gọi SerpApi và không tiêu quota. `SerpApiLiveSmokeTest` chỉ chạy khi bật `SERPAPI_LIVE_TEST=true` và truyền key qua môi trường; test này gửi đúng một truy vấn `cotton shirt`, kiểm tra lần tìm tiếp theo dùng cache, và lưu DTO không chứa key vào `.playwright-mcp/`. Để kiểm tra dữ liệu thật cần key Free hợp lệ trên máy. Tích hợp provider qua `AmazonSearchProvider`; tăng gói sau này bằng cấu hình có chủ đích, không cần đổi contract frontend. Import ASIN cũng dùng SerpApi (`engine=amazon_product`) và chia sẻ quota với Search. Nếu API không khả dụng, import trả lỗi rõ ràng và không tạo listing giả.

---

## Deploy (Hostinger VPS)

Docker Compose (backend + PostgreSQL) + Nginx (serve bản build React và reverse proxy `/api`, `/uploads`).

Checklist trước go-live:
- [ ] `JWT_SECRET` thật, tối thiểu 64 ký tự, chỉ đặt qua biến môi trường
- [ ] CORS chỉ cho phép domain production (`app.cors.allowed-origin-patterns`)
- [ ] HTTPS toàn bộ, HTTP redirect sang HTTPS
- [ ] PostgreSQL backup tự động (cron + `pg_dump`)
- [ ] `SERPAPI_API_KEY` và các secret khác trong biến môi trường
- [ ] R2 dùng token giới hạn đúng bucket và custom domain production khi bật `STORAGE_PROVIDER=r2`
- [ ] Đổi hoặc vô hiệu hoá mọi tài khoản seed trước khi mở cho người dùng
- [ ] Trang responsive từ 375px, test từng role trên desktop và mobile

---

## Liên hệ

**Happy Creative Technical**: happyc.technical@gmail.com
