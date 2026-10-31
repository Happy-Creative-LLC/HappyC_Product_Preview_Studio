# HappyC Product Preview Studio: hướng dẫn cho Claude

Internal tool của Happy Creative: xem trước listing Amazon/Etsy, mỗi vai trò hoàn thiện vùng của mình, kiểm tra bằng Listing Guard, duyệt trước khi publish. Tổng quan và cách chạy: [README.md](README.md).

## Stack

- Frontend: React 19, Vite, TailwindCSS 3, Zustand, React Router 7, Axios (`frontend/`, dev cổng 5173).
- Backend: Spring Boot 4.0.6, Java 21, Spring Security + JWT, Spring Data JPA (`backend/`, cổng 8081). Preview theo kiến trúc hexagonal (`domain/`, `application/`, `infrastructure/`), phần còn lại Controller → Service → Repository → Entity.
- Database: PostgreSQL 15, schema do Flyway quản lý. Test dùng H2 (Flyway tắt, H2 dựng schema từ entity).
- Role (backend trả viết hoa): `ADMIN`, `MARVEL`, `SELLER`, `PRODUCT_DESIGN`. Frontend so sánh đúng chuỗi này.

## Lệnh

```powershell
docker compose up -d                                  # Postgres dev
cd backend;  .\mvnw.cmd spring-boot:run               # cần JWT_SECRET (xem .env.example)
cd backend;  .\mvnw.cmd test                          # unit + tích hợp (Testcontainers PostgreSQL 15, cần Docker); phải pass trước khi push
cd backend;  .\mvnw.cmd test "-Dtest=AuthorizationApiTest"   # chạy một lớp test
cd frontend; npm run dev
cd frontend; npm run lint; npm run build; npm test    # cả ba phải pass trước khi push (npm test = Vitest + Testing Library)
```

Seed user dev: `SPRING_PROFILES_ACTIVE=dev` kèm `DEV_SEED_PASSWORD` trong `.env` (xem README). Production không bật profile `dev`.

## Quy ước

- **Flyway:** mọi thay đổi schema là file mới `backend/src/main/resources/db/migration/V<n>__<mô_tả>.sql`. Không sửa migration đã chạy ở bất kỳ môi trường nào. `ddl-auto` là `validate`; đổi entity thì phải kèm migration. Migration viết cho PostgreSQL.
- **Secret:** chỉ đọc từ biến môi trường (`.env` đã gitignore, mẫu ở `.env.example`). Không hard-code, không đặt giá trị mặc định cho secret trong code hay `application.yml`, không commit key, không log key. Thiếu `JWT_SECRET` thì app không khởi động.
- **Phân quyền** kiểm ở backend, không chỉ ẩn UI. Quy tắc nằm ở `AccessControlService` (project, vùng Text/Ảnh/Video, đổi trạng thái task) và `PreviewAccessService` (preview, comment). Task hoặc preview của project user không xem được trả **404**, không trả 403. Mỗi quy tắc mới phải có test ở `AuthorizationApiTest` (HTTP thật trên PostgreSQL) và test đơn vị. Thông báo lỗi cho người dùng bằng tiếng Việt.
- **Test:** bug chỉ lộ trên PostgreSQL thật (Flyway, `validate`, locking của Hibernate) thì viết test Testcontainers; test chạy H2 hoặc mock repository không thấy được.
- **Nhánh:** `feat/...`, `fix/...`, `chore/...`, `docs/...` tách từ `main`. Mỗi phase trong [docs/ui-plan.md](docs/ui-plan.md) là một nhánh và một PR.
- **Commit:** Conventional Commits (`type(scope): mô tả`), commit nhỏ, mô tả tiếng Việt.
- **Không merge, không push lên `main`.** Push nhánh, người dùng tự mở PR.
- Không commit log (`*.log`) và file thử API (`backend/rapidapi_*.json`).

## Thiết kế và kế hoạch

- **Nguồn thiết kế:** `docs/design/uiux-v1/` (15 màn: Main = tổng quan, luồng, quy ước, danh sách màn; còn lại mỗi file một màn). Bản đang có trên máy là một file gộp `docs/uiux-v1/Preview Studio UI UX.html`, chưa commit.
- **Kế hoạch:** [docs/ui-plan.md](docs/ui-plan.md): bảng chênh lệch thiết kế và code, thay đổi DB/API, các phase P1 đến P8, quyết định còn chờ.
- Thiết kế mâu thuẫn với code hoặc với chính nó thì **dừng và hỏi**, không tự suy diễn. Các quyết định còn chờ trong ui-plan.md không tự chốt.

## Listing Guard

Dịch vụ kiểm tra quy tắc sàn và rủi ro trademark, repo `thanhdatpb/Listing-Guard`. API: `POST/GET /api/v1/checks`, `POST/GET /api/v1/trademark-checks`, header `X-API-Key`; trademark chưa cấu hình trả `503 trademark-not-configured`. Chỉ gọi từ backend Preview, không gọi từ trình duyệt; key lấy từ biến môi trường (`LISTING_GUARD_API_KEY`). Kết quả chỉ là cảnh báo tham khảo; Listing Guard sập hoặc `503` không được chặn việc soạn nội dung.
