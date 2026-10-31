# Kế hoạch triển khai UI/UX v1 và tích hợp Listing Guard

Nguồn thiết kế: bộ `uiux-v1` (15 màn). Tài liệu này đối chiếu thiết kế với code tại `main` (commit 954e232, 2026-10-31), chia công việc thành các phase mỗi phase một PR, và ghi lại những quyết định còn chờ. Trạng thái "đã làm" chỉ có PR 0 (nhánh `chore/cleanup-before-ui`).

Quy ước đọc: **Màn N** là số màn trong thiết kế (1 Danh sách task, 2 Import từ Sheet, 3 Soạn nội dung Amazon, 4 Preview chế độ review, 5 Duyệt task, 6 Quản trị tích hợp, 7 Đăng nhập, 8 Dự án, 9 Quản lý nhân sự, 10 Soạn nội dung Etsy, 11 Amazon Search Preview, 12 đến 14 Mobile).

## 1. Nguồn thiết kế

- Brief của người giao việc: 15 file `.dc.html` trong `docs/design/uiux-v1/`. **Thực tế trong repo/máy:** chỉ có một file gộp `docs/uiux-v1/Preview Studio UI UX.html` (8,7 MB, chưa commit) chứa đủ 15 trang (Main + 14 màn). Đã giải nén và đọc cả 15 trang từ file này; nội dung đủ để lập kế hoạch. Cần xác nhận: commit nguyên file gộp, hay đưa 15 file vào `docs/design/uiux-v1/` (câu hỏi Q4).
- Thiết kế mô tả luồng 7 bước: import từ Sheet, bổ sung theo vùng (Product Design ảnh, Marvel video, Seller text), Listing Guard tự kiểm tra khi lưu, xử lý cảnh báo (sửa hoặc bỏ qua kèm lý do), gửi duyệt, duyệt (Đã duyệt hoặc Cần sửa), upload lên sàn ngoài hệ thống.
- Quy ước trạng thái trong thiết kế: task `Chờ nội dung / Đang duyệt / Đã duyệt / Cần sửa` tương ứng enum hiện có `PENDING_UPLOADS / IN_REVIEW / APPROVED / REJECTED` (chỉ đổi nhãn tiếng Việt). Rủi ro trademark `Cao / Trung bình / Thấp·thông tin / Không xác định` (Không xác định không bao giờ hiển thị như "an toàn"). Quy tắc sàn `Lỗi / Cảnh báo / Thông tin` lấy từ `ERROR / WARNING / INFO` của `/api/v1/checks`. Mỗi trạng thái có chữ và biểu tượng, không chỉ màu.

## 2. Kết quả kiểm tra hiện trạng

### 2.1 Các vấn đề đã nêu (kiểm lại trên `main`)

| Vấn đề | Kết quả kiểm | Xử lý |
|---|---|---|
| Log và `rapidapi_*.json` bị commit | Đúng: `backend-run.log`, `backend/spring.log` (khoảng 190 KB), `backend/rapidapi_test.json` (560 KB), `rapidapi_app_test.json`, `rapidapi_app_test_2.json`. Quét nội dung: không có JWT hay RapidAPI key. File vẫn nằm trong lịch sử git cũ | PR 0 gỡ khỏi git và gitignore. Lịch sử cũ giữ nguyên (không có secret nên không bắt buộc xoá) |
| `jwt.secret` có giá trị mặc định | Đúng và **nhân đôi**: có ở `application.yml` và cả `@Value("${jwt.secret:default...}")` trong `JwtTokenProvider` | PR 0 bỏ cả hai, thiếu `JWT_SECRET` hoặc ngắn hơn 64 byte thì không khởi động |
| `ddl-auto: update`, không Flyway | Đúng | PR 0 chuyển Flyway, `validate` |
| `show-sql: true` | Đúng, log cả cột `password_hash` | PR 0 tắt |
| README nhắc `database/` không tồn tại | Đúng trong git: `database/` bị gitignore nên chỉ có ở máy tác giả. `docker-compose.yml` còn bind-mount `./database/init.sql`, trên bản clone mới Docker sẽ tạo thư mục rỗng thay cho file | PR 0 sửa README và bỏ mount |

### 2.2 Vấn đề phát hiện thêm

1. **`mvnw.cmd test` đỏ trên `main`** (5 trong 49 test fail): `AmazonScraperServiceTest` không compile (entity đổi sang `Instant` mà test còn `LocalDateTime`) và 2 test đã lỗi thời sau commit 58af41e (cache luôn được phục vụ, bỏ fallback mock); `CreatePreviewUseCaseTest` fail thật vì code lưu file và preview trước khi kiểm user/task tồn tại. PR 0 sửa cả hai nhóm.
2. **`npm run lint` đỏ trên `main`**: 40 lỗi (30 do `import React` không dùng, còn lại `react-hooks/set-state-in-effect`, `no-empty`, biến thừa). PR 0 sửa, hành vi không đổi.
3. **`database/init.sql` hỏng:** `INSERT INTO projects (id, key, name)` nhưng cột là `project_key`, nên seed không bao giờ chạy. DB dev hiện có 0 project, 0 user. Cần chốt cách seed (Q5).
4. **Cổng DB:** `docker-compose.yml` map `5432`, nhưng container dev hiện có map `127.0.0.1:5433`, và `application.yml` trỏ cứng `localhost:5432`. Chạy được là nhờ biến môi trường trên máy tác giả. Khuyến nghị đặt `SPRING_DATASOURCE_URL` rõ ràng trong `.env`.
5. **Lỗ hổng phân quyền ở backend** (quan trọng cho P5):
   - `PUT /api/tasks/{id}` cho `SELLER` đổi `status` thành bất kỳ giá trị nào, **kể cả `APPROVED`**. Seller tự duyệt được task của mình.
   - `POST /api/previews/upload`, `/import`, `GET /api/previews/{id}`, `GET/POST .../comments`, `PUT /api/comments/{id}/resolve` chỉ yêu cầu đăng nhập; không kiểm project, không kiểm vùng (Seller upload ảnh được, Product Design sửa text được ở mức API).
   - CORS mặc định cho `10.*`, `172.*`, `192.168.*`.
   Đề xuất vá phần status ở PR riêng nhỏ trước P5 (Q11).
6. **Mô hình dữ liệu nội dung chưa khớp thiết kế:** mỗi lần "Lưu" ở `AmazonUploadForm` tạo một `Preview` mới (multipart tạo mới, không có API sửa). Backend có `findByTaskId` nhưng không có route; `TaskDetailPage` giữ `previewId` trong state React nên tải lại trang là mất liên kết. Thiết kế (Đã lưu 14:32, mỗi vai trò sửa vùng của mình, Kiểm tra lại) cần một "preview hiện hành của task" và API sửa theo vùng.
7. `productStore.js` còn dữ liệu demo hard-code dùng làm scaffold khi chưa có preview thật (hợp lệ, không có trong thiết kế; giữ nguyên).
8. Frontend chưa có test runner (không Vitest/Jest). Backend test chạy trên H2, V1 là SQL PostgreSQL nên migration chưa có test thật (đề xuất ở P1).

### 2.3 Năm chênh lệch lớn nhất giữa thiết kế và code

1. **Chưa có tích hợp Listing Guard nào**: không client, không lưu kết quả, không cảnh báo trên trường, không comment hệ thống (Màn 3, 4, 5, 10, 11, 14).
2. **Mô hình nội dung**: thiếu SKU và các trường text (description, search terms, product_type; Etsy tags, materials, who_made, when_made, taxonomy), không có API sửa theo vùng và "preview hiện hành của task" (Màn 3, 10).
3. **Luồng duyệt chưa tồn tại**: không quyền Duyệt, không endpoint duyệt/yêu cầu sửa, không checklist, chính sách chặn/cảnh báo, lịch sử task; hiện Seller tự đặt được `APPROVED` (Màn 5, 9, 8).
4. **Import từ Sheet và mẫu ánh xạ chưa có** (Màn 2, 6).
5. **Comment không có neo và không có tác giả hệ thống**: chỉ `targetComponent` (IMAGE/VIDEO/TEXT/APLUS/GENERAL), thiếu trường và vị trí chữ, mức rủi ro, trạng thái đã sửa/bỏ qua kèm lý do, đánh số ghim; chưa có "Hiện cảnh báo trên trang" và xác nhận nguồn ảnh (Màn 4, 14).

## 3. Bảng chênh lệch theo màn

| Màn | Đã có trong code | Thiếu so với thiết kế | Phase |
|---|---|---|---|
| 1 Danh sách task | `TaskListPage`: lọc trạng thái, tìm theo tên, tạo task; API trả `pendingTaskCount` ở project | Cột Nội dung (Ảnh x, Video x, Text x), Trademark, Quy tắc sàn, SKU; lọc theo kết quả kiểm tra và sàn; ô thống kê theo trạng thái; banner "N task rủi ro cao chưa xử lý"; nút Import từ Sheet; phân trang. Cần API trả tổng hợp media và kết quả kiểm tra mới nhất | P6 (cột LG cần P3) |
| 2 Import từ Sheet | Không có | Toàn bộ: tải CSV, chọn mẫu ánh xạ, ánh xạ cột, xem trước (tạo mới, cập nhật, dòng lỗi), tải danh sách lỗi, tạo hoặc cập nhật task theo SKU (chỉ ghi vùng Text) | P2 |
| 3 Soạn nội dung Amazon | `TaskDetailPage` + `AmazonUploadForm` (title, price, brand, fabricType, careInstructions, origin, 5 bullet, ảnh, video, màu, size, A+) | `description`, `search_terms` (đếm byte), `product_type` (dropdown bắt buộc), SKU; đếm ký tự; bảng "Kiểm tra listing" (Tất cả, Trademark, Quy tắc), đánh dấu chữ theo vị trí, "Đi tới trường", "Bỏ qua…" kèm lý do, "Kiểm tra lại", catalog/ruleset version, disclaimer; nguồn ảnh (nội bộ, mockup, ảnh của khách) và xác nhận; ba vùng tách theo vai trò, lưu tự động ("Đã lưu hh:mm"), nút Gửi duyệt | P1, P3 |
| 4 Preview chế độ review | `AmazonPreviewPage` + `EditableZone` + `CommentSection` (lọc theo thành phần, resolve) | Công tắc "Hiện cảnh báo trên trang" ghim số vào đúng chữ; trường người mua không thấy (search terms, product_type); comment hệ thống tác giả "Listing Guard" có mức rủi ro, đã sửa/đã bỏ qua kèm lý do; lọc Chưa xử lý/Listing Guard; "Đi tới trường"; comment gắn trường; nút Gửi duyệt | P4 |
| 5 Duyệt task | Không có (chỉ enum trạng thái) | Trang duyệt: checklist (số ảnh đủ, ảnh khách đã xác nhận, text đủ trường bắt buộc, rủi ro cao chưa xử lý, cảnh báo đã bỏ qua), ghi chú cho Seller, Duyệt / Yêu cầu sửa / Duyệt dù còn rủi ro (lý do bắt buộc), lịch sử task | P5 |
| 6 Quản trị tích hợp | `AdminUsersPage` (chỉ nhân sự) | Tab Tích hợp Listing Guard (địa chỉ, key qua env, client, kiểm tra kết nối `/health`, thông tin catalog, ruleset), chính sách kiểm tra và duyệt, tab Mẫu ánh xạ Sheet | P6 (mẫu ánh xạ tạo ở P2, chính sách ở P5) |
| 7 Đăng nhập | `LoginPage`: Google + tài khoản nội bộ; backend đã báo "Email này chưa được Admin cấp quyền", chờ phê duyệt, bị khoá | Bố cục theo thiết kế (Google là chính, nội bộ là phụ), hiển thị lỗi email chưa được cấp quyền đúng chỗ | P7 |
| 8 Dự án | `ProjectsPage`: thẻ project, `pendingTaskCount` | Khối "Chờ bạn duyệt", số task theo 4 trạng thái và rủi ro từng project, lead, thời điểm cập nhật; chỉ Admin và Marvel | P6 |
| 9 Quản lý nhân sự | `AdminUsersPage`: thêm, sửa, khoá, lần login cuối | Cột và cờ **Quyền Duyệt**, lọc theo vai trò, "tạm khoá" rõ ràng | P5 |
| 10 Soạn nội dung Etsy | `AmazonUploadForm` dùng chung cho Etsy (giới hạn 20 ảnh); `EtsyPreviewPage` chỉ xem | `tags` dạng chip (13, mỗi tag tối đa 20 ký tự, đánh dấu lỗi), `materials`, `who_made`, `when_made`, `taxonomy`, số lượng, giá; bảng Kiểm tra listing với ruleset etsy | P1, P3 |
| 11 Amazon Search Preview | Đã dựng lại (PR #28): chèn listing vào vị trí bất kỳ, khuyến mãi, vận chuyển, giao hàng, cache | Huy hiệu rủi ro lấy từ task ("Cao · Title có nhãn hiệu…"), dòng "Dữ liệu thật · cache ngày …", ghi chú "sửa ở đây chỉ để thử, không lưu vào task", lấy dữ liệu từ task theo `taskId` | P7 |
| 12 Mobile Tasks | `useIsMobile`, header mobile cho Preview | Danh sách task mobile có lọc nhanh rủi ro cao/đang duyệt/cần sửa, tab dưới | P8 |
| 13 Mobile soạn nội dung | Không có | Soạn theo bước (Ảnh, Video, Text, Kiểm tra), thu gọn bullet | P8 |
| 14 Mobile Preview review | Preview mobile có sticky CTA, gallery | Review bằng bottom sheet, "Ghim", comment 1/3 | P8 |

## 4. Thay đổi DB và API cần có

### 4.1 Migration (Flyway, đánh số theo thứ tự phase)

| Migration | Phase | Nội dung |
|---|---|---|
| `V2__task_sku_and_listing_text.sql` | P1 | `tasks.sku VARCHAR(100)` (null được cho task cũ), index `(project_id, sku)`. Trường text mới (description, searchTerms, productType; Etsy: tags[], materials[], whoMade, whenMade, taxonomyPath, quantity) nằm trong `previews.product_data` (JSONB), không thêm cột |
| `V3__sheet_mapping_templates.sql` | P2 | `sheet_mapping_templates(id, project_id FK, platform, name, mapping JSONB, created_by, updated_by, created_at, updated_at)`, unique `(project_id, platform, name)`. Mẫu theo project |
| `V4__listing_checks.sql` | P3 | `listing_checks(id, preview_id FK, kind RULES\|TRADEMARK, status, lg_check_id, ruleset_version, catalog_version, analysis_version, content_hash, risk_level, completeness, summary JSONB, disclaimer, text_hash, created_at, expires_at)` và `listing_check_findings(id, check_id FK, ordinal, kind, rule_id, level, field, start_idx, end_idx, snippet, mark, match_type, score, source_ids JSONB, message, suggestion, fingerprint)`. `fingerprint` ổn định qua các lần kiểm để giữ trạng thái đã bỏ qua |
| `V5__image_source.sql` | P3 | Nguồn ảnh và xác nhận ảnh của khách. Đề xuất giữ `product_data.images[]` là mảng chuỗi (không phá renderer) và thêm bảng `preview_image_meta(preview_id, image_url, source SELLER\|MOCKUP\|CUSTOMER_CONTENT, confirmed_by, confirmed_at)` |
| `V6__comment_anchor_and_system_comments.sql` | P4 | `comments`: `source USER\|LISTING_GUARD`, `field_path`, `anchor_start`, `anchor_end`, `severity`, `finding_id FK` null, `pin_no`, `resolution OPEN\|FIXED\|DISMISSED`, `dismiss_reason`, `dismissed_by`, `dismissed_at`; `user_id` cho phép null với `source = LISTING_GUARD` (hoặc user hệ thống, xem Q7). Giữ `is_resolved` để không phá `CommentSection` |
| `V7__approval_and_audit.sql` | P5 | `users.can_approve BOOLEAN NOT NULL DEFAULT FALSE` (backfill `TRUE` cho Admin); `approval_policies(id, project_id null = mặc định, block_on_high BOOLEAN DEFAULT TRUE, auto_check_on_save, auto_check_on_import, seller_can_dismiss_medium, seller_can_dismiss_high, require_customer_image_confirmation, updated_by, updated_at)`; `task_events(id, task_id FK, event_type, actor_id, detail JSONB, created_at)`; cột duyệt trên `tasks` (`submitted_at/by`, `reviewed_at/by`, `review_note`, `override_reason`) hoặc suy ra từ `task_events` |

Không có migration ở P7, P8 (chỉ UI). P6 có thể cần chỉ mục tổng hợp (quyết định khi làm).

### 4.2 API

| Phase | Endpoint | Ghi chú |
|---|---|---|
| P1 | `GET /api/tasks/{id}/preview` | Preview hiện hành (bản mới nhất) của task, kiểm quyền project |
| P1 | `PUT /api/tasks/{id}/content/text` | Seller, Admin; ghi vùng Text, tăng `version`, tạo preview nếu chưa có |
| P1 | `POST /api/projects/{id}/tasks` nhận `sku` | Seller, Admin |
| P2 | `POST /api/projects/{id}/imports/preview`, `POST .../imports` | CSV multipart + mẫu; trả bảng xem trước, rồi tạo/cập nhật theo SKU |
| P2 | `GET/POST/PUT /api/projects/{id}/sheet-templates` | Theo project |
| P3 | `POST /api/tasks/{id}/checks` | Chạy `/checks` rồi `/trademark-checks`, lưu kết quả; `GET /api/tasks/{id}/checks/latest` |
| P3 | `PUT /api/previews/{id}/images/{key}/source`, `POST .../confirm` | Nguồn ảnh và xác nhận ảnh khách (Product Design, Admin) |
| P4 | `POST /api/comments/{id}/dismiss` (kèm `reason`), mở rộng `GET .../comments` | Findings thành comment hệ thống sau mỗi lần kiểm |
| P5 | `POST /api/tasks/{id}/submit`, `/approve`, `/request-changes`; `GET /api/tasks/{id}/approval-checklist`, `GET /api/tasks/{id}/events` | Chuyển trạng thái chỉ qua các endpoint này; `PUT /api/tasks/{id}` bỏ nhận `status` |
| P5 | `GET/PUT /api/admin/policy`; `PUT /api/admin/users/{id}` nhận `canApprove` | |
| P6 | `GET /api/projects/{id}/tasks` mở rộng (đếm media, tóm tắt kiểm tra), `GET /api/approvals/pending`, `GET /api/admin/integrations/listing-guard`, `POST .../test` | |

### 4.3 Client Listing Guard (khung chung cho P3 đến P5)

- Backend gọi qua `RestClient`, header `X-API-Key` (env `LISTING_GUARD_API_KEY`, không mặc định), `X-Request-Id`, cấu hình `listing-guard.base-url`. Để trống thì tính năng tắt, không lỗi khi khởi động. Trình duyệt không bao giờ gọi trực tiếp.
- Thứ tự gọi: `/checks` trước, hiển thị ngay; `/trademark-checks` với cùng JSON sau. `503 trademark-not-configured` hoặc lỗi mạng cho phần trademark: lưu `status` không hoàn tất, `risk_level = UNKNOWN`, quy tắc sàn vẫn hiển thị, **không** chặn soạn nội dung. Cũng đúng khi Listing Guard sập hoàn toàn.
- Retry theo hướng dẫn tích hợp: timeout vài giây, `429` chờ `Retry-After`, `5xx` tối đa 2 lần backoff, không retry `4xx` khác. Giới hạn 60 yêu cầu mỗi phút mỗi client, nên tự kiểm khi lưu phải gộp lần lưu liên tiếp (debounce phía frontend và dedupe theo `text_hash` phía backend).
- Ánh xạ listing sang định dạng chuẩn: Amazon `title, brand, bullet_points, description, search_terms, product_type, price, quantity, images`; Etsy `title, description, tags, price, taxonomy_path, materials, images, quantity, who_made, when_made`.
- Đánh dấu chữ: offset của trademark tính trên văn bản đã làm sạch, chuẩn hoá NFC rồi trim kiểu Java, đơn vị UTF-16. Frontend chuẩn hoá cùng cách rồi cắt chuỗi; khi lệch thì khớp theo `snippet`. Với `bullet_points[i]` và `tags[i]`, chỉ số tính trong danh sách đã bỏ phần tử rỗng: lưu bản ánh xạ chỉ số lúc kiểm.
- "Chưa kiểm tra" khi `text_hash` hiện tại khác lần kiểm cuối.
- Mọi kết quả trademark kèm disclaimer "chỉ là cảnh báo tham khảo", luôn hiển thị.

## 5. Các phase

Mỗi phase là một nhánh `feat/...` tách từ `main` đã gồm PR trước, một PR. Tiêu chí chung: `mvnw.cmd test`, `npm run lint`, `npm run build` đều pass; migration mới chạy trên DB trống và trên DB dev đã baseline; không phá API đang dùng.

### P1. Trường text Amazon và Etsy (Màn 3, 10)

- **File:** `AmazonUploadForm.jsx` (tách form Amazon và Etsy, tách vùng Text khỏi vùng media, lưu tự động), `TaskDetailPage.jsx` (nạp preview hiện hành), `TaskListPage.jsx` (tạo task nhập SKU), `appStore.js`; backend: `TaskService`, `TaskRequest/Response` (thêm `sku`), `PreviewController`, `CreatePreviewUseCaseImpl` + use case mới cập nhật text, `ProductData`, `PreviewDto`.
- **Migration:** `V2`.
- **API:** `GET /api/tasks/{id}/preview`, `PUT /api/tasks/{id}/content/text`, `sku` ở tạo task.
- **Test:** unit cho use case cập nhật text (quyền Seller/Admin, version, tạo preview khi chưa có); `WebMvcTest` kiểm 403 cho Product Design và Marvel; test migration `V2` trên PostgreSQL thật (đề xuất thêm Testcontainers, Q12); kiểm tay trên trình duyệt: lưu, tải lại trang, nội dung còn nguyên.
- **Xong khi:** Seller nhập đủ title, bullet, description, search terms, product_type (Amazon) hoặc tags, materials, who_made, when_made, taxonomy (Etsy), lưu rồi tải lại vẫn thấy; Preview hiển thị các trường mới (search terms và product_type ở khối "người mua không thấy" để dành cho P4); giữ nguyên upload ảnh/video hiện có; không còn phụ thuộc `previewId` trong state.

### P2. Import từ Sheet và mẫu ánh xạ (Màn 2, phần mẫu ở Màn 6)

- **File:** trang `ImportSheetPage.jsx` mới (4 bước như thiết kế), `TaskListPage.jsx` (nút Import), route mới; backend: `ImportService`, parser CSV, `SheetTemplateService/Controller`, DTO xem trước.
- **Migration:** `V3`.
- **API:** `imports/preview`, `imports`, `sheet-templates` (mục 4.2).
- **Test:** unit parser (dấu phẩy trong ô, xuống dòng, BOM UTF-8, cột thiếu, dòng lỗi); import cập nhật theo SKU chỉ động vào vùng Text, không đụng ảnh, video, comment; template theo project, người ngoài project nhận 403; giới hạn kích thước file (đề xuất 5 MB).
- **Xong khi:** CSV mẫu 42 dòng cho kết quả "36 tạo mới, 3 cập nhật, 3 lỗi", tải được danh sách dòng lỗi; mẫu lưu lại và áp dụng lại ở lần sau; task mới ở trạng thái `PENDING_UPLOADS`. Ghi chú: thiết kế là **upload CSV tải từ Sheet**, không gọi Google Sheets API (Q6).

### P3. Client Listing Guard và bảng kết quả ở màn soạn (Màn 3, 10)

- **File:** backend `ListingGuardClient` (port ở `application/`, adapter ở `infrastructure/`), `ListingCheckService/Controller`, mapper listing, entity/repository kết quả; frontend component `ListingCheckPanel.jsx` (tab Tất cả/Trademark/Quy tắc, "Đi tới trường", "Kiểm tra lại"), đánh dấu chữ trong ô nhập, `ImageSourceSelect` và xác nhận ảnh khách ở vùng ảnh.
- **Migration:** `V4`, `V5`. Nếu PR quá lớn, tách phần nguồn ảnh (`V5`) thành P3b.
- **API:** `POST /api/tasks/{id}/checks`, `GET .../checks/latest`, nguồn và xác nhận ảnh.
- **Test:** `ListingGuardClient` với server giả (`MockRestServiceServer`): 200, `401`, `429` kèm `Retry-After`, `5xx` retry, timeout, `503 trademark-not-configured`; mapper Amazon và Etsy đúng tên trường; offset UTF-16 với tiếng Việt và emoji; `UNKNOWN` không bao giờ thành "đạt"; dedupe theo `text_hash`; Listing Guard sập vẫn lưu được nội dung.
- **Xong khi:** lưu text thì bảng kết quả hiện đủ mức rủi ro, quy tắc, phiên bản catalog/ruleset, disclaimer; chữ bị cảnh báo được đánh dấu (gạch liền cao, gạch đứt trung bình); khi Listing Guard tắt hoặc `503`, bảng báo "Không xác định" và vẫn soạn tiếp được; ảnh của khách xác nhận được bởi Product Design.

### P4. Cảnh báo ghim trên Preview và comment hệ thống (Màn 4)

- **File:** `AmazonPreviewPage.jsx`, `EtsyPreviewPage.jsx`, `CommentSection.jsx` (lọc Listing Guard, Chưa xử lý, trả lời, đi tới trường), component `PinOverlay.jsx` (số ghim khớp comment), khối "trường người mua không thấy"; backend `CommentService/Controller` mở rộng, đồng bộ findings thành comment sau mỗi lần kiểm (giữ trạng thái đã bỏ qua theo `fingerprint`), kiểm quyền theo project cho preview và comment.
- **Migration:** `V6`.
- **API:** `dismiss`, mở rộng `GET/POST comments`.
- **Test:** tạo comment hệ thống từ findings, không nhân đôi khi kiểm lại, finding biến mất thì đánh dấu "Đã sửa"; bỏ qua cần lý do và đúng quyền (theo chính sách, hoàn thiện ở P5); người ngoài project nhận 403 ở `GET /api/previews/{id}` và comment; kiểm tay công tắc "Hiện cảnh báo trên trang".
- **Xong khi:** mỗi cảnh báo xuất hiện thành comment tác giả "Listing Guard" có mức rủi ro, gắn đúng trường; công tắc ghim số vào đúng chữ trên trang mô phỏng; Seller sửa hoặc bỏ qua kèm lý do thì comment đổi trạng thái. Bản mobile của Màn 14 để P8.

### P5. Duyệt, checklist, chính sách, lịch sử, quyền Duyệt (Màn 5, 9)

- **File:** trang `TaskApprovalPage.jsx` mới, `AdminUsersPage.jsx` (cột và cờ Quyền Duyệt), `TaskDetailPage.jsx` (Gửi duyệt), khối lịch sử task; backend `ApprovalService` (checklist, chính sách chặn/cảnh báo, duyệt dù còn rủi ro cần lý do), `TaskEventService`, `PolicyService`, `AccessControlService` (quyền Duyệt), `TaskService` (bỏ nhận `status`).
- **Migration:** `V7`.
- **API:** `submit`, `approve`, `request-changes`, `approval-checklist`, `events`, `admin/policy`, `canApprove` ở user.
- **Test:** ma trận quyền (Seller không tự duyệt được, Marvel và Product Design 403, người có quyền Duyệt thì được); chính sách `block`: còn rủi ro cao thì từ chối duyệt; chính sách `warn`: duyệt được khi có lý do, lý do và người duyệt vào lịch sử; kiểm lại luôn chạy khi Gửi duyệt; chuyển trạng thái trái luồng bị từ chối; mọi sự kiện (kiểm tra, bỏ qua, xác nhận ảnh, gửi duyệt, duyệt, yêu cầu sửa) có trong `task_events`.
- **Xong khi:** mặc định chính sách là **chặn** và làm được cả hai lựa chọn bằng cấu hình; Admin bật sẵn quyền Duyệt, gán thêm được cho user khác; Seller không còn tự đặt `APPROVED` qua API.

### P6. Danh sách task, dự án, quản trị tích hợp (Màn 1, 8, 6)

- **File:** `TaskListPage.jsx` (cột, lọc, thống kê, phân trang), `ProjectsPage.jsx` (chờ bạn duyệt, rủi ro theo project), trang quản trị tích hợp mới (Kết nối, Catalog, Chính sách, Mẫu ánh xạ) trong khu Quản trị cùng Nhân sự; backend tổng hợp (đếm media, kết quả kiểm tra mới nhất), `IntegrationAdminService` (gọi `/health`, đọc phiên bản từ lần kiểm gần nhất).
- **Migration:** không bắt buộc; thêm chỉ mục nếu truy vấn tổng hợp chậm.
- **API:** `GET /api/projects/{id}/tasks` mở rộng, `GET /api/approvals/pending`, `integrations/listing-guard`.
- **Test:** tổng hợp đúng số liệu, quyền theo project, không rò thông tin giữa project; kiểm kết nối không bao giờ trả API key; kiểm tay các bộ lọc.
- **Xong khi:** Màn 1 hiện cột Trademark và Quy tắc sàn từ kết quả mới nhất ("Chưa kiểm tra" khi nội dung đổi sau lần kiểm cuối); Màn 8 chỉ Admin và Marvel; Màn 6 chỉnh được chính sách và hiển thị trạng thái kết nối, API key không hiện trên giao diện. Mục "Thông tin catalog" (Nguồn, Ngày dữ liệu) cần dữ liệu mà Listing Guard hiện chưa có endpoint riêng (Q9).

### P7. Làm lại đăng nhập và Amazon Search (Màn 7, 11)

- **File:** `LoginPage.jsx`, `GoogleSignInButton.jsx`, `AmazonSearchPage.jsx`, `SearchListingEditor.jsx`, `SearchResultCard.jsx`.
- **Migration và API:** không.
- **Test:** đăng nhập Google email chưa cấp quyền, đang chờ, bị khoá đều ra đúng thông báo tiếng Việt; Search lấy dữ liệu từ task, sửa trên trang không ghi ngược vào task; huy hiệu rủi ro khớp kết quả kiểm gần nhất.
- **Xong khi:** hai màn khớp thiết kế, hành vi cache hiện tại giữ nguyên.

### P8. Mobile (Màn 12 đến 14)

- **File:** danh sách task mobile, soạn nội dung theo bước (Ảnh, Video, Text, Kiểm tra), review bằng bottom sheet và "Ghim", điều hướng dưới; dùng `useIsMobile`.
- **Migration và API:** không.
- **Test:** kiểm tay ở 375 px (iPhone SE) và 390 px, hai vai trò Seller và Product Design; không cuộn ngang; mục chạm đủ lớn.
- **Xong khi:** ba màn mobile khớp thiết kế, luồng kiểm tra và xử lý cảnh báo dùng được trên điện thoại.

## 6. Quyết định còn chờ (không tự chốt)

Ba quyết định thiết kế nêu ra, kèm cách làm tạm để code không bị chặn:

| # | Quyết định | Cách xử lý trong kế hoạch |
|---|---|---|
| D1 | Khi còn rủi ro trademark cao: chặn duyệt hay cảnh báo kèm lý do (CCO chốt) | Làm cả hai bằng `approval_policies.block_on_high`, **mặc định chặn**. Đổi mặc định chỉ cần đổi cấu hình |
| D2 | Ai có quyền Duyệt: chỉ Admin, hay thêm Project Lead | Thêm cờ `users.can_approve`; Admin bật sẵn. Gán được cho bất kỳ user, nên không cần thêm vai trò mới |
| D3 | Mẫu Sheet dùng chung hay theo project | Làm **theo project** (`sheet_mapping_templates.project_id`) |

Câu hỏi mới phát sinh khi kiểm tra, cần chủ dự án trả lời:

- **Q4.** Bộ thiết kế: commit nguyên file gộp `docs/uiux-v1/Preview Studio UI UX.html` hay đưa 15 file vào `docs/design/uiux-v1/`? (CLAUDE.md đang trỏ tới đường dẫn thứ hai.)
- **Q5.** Seed dữ liệu cho DB dev: thêm migration cho 4 project (dữ liệu tham chiếu) và seed user chỉ chạy ở profile dev? Mật khẩu `Happyc123@` đang công khai (Open Issue #5 cũ) nên không đưa vào seed production.
- **Q6.** "Import từ Google Sheet" là upload file CSV tải từ Sheet (đúng như thiết kế vẽ), không tích hợp Google Sheets API. Xác nhận.
- **Q7.** Tác giả comment hệ thống: cho `comments.user_id` null kèm `source = LISTING_GUARD`, hay tạo một user hệ thống bị khoá?
- **Q8.** Hạn mức media Case 2 và Case 3 vẫn chưa chốt (Open Issue #1 cũ). Checklist ở Màn 5 cần con số "đủ ảnh" cho từng case; hiện chỉ Case 1 (7 ảnh, hoặc 6 ảnh và 1 video) là rõ.
- **Q9.** Màn 6 hiển thị Nguồn và Ngày dữ liệu catalog, nhưng API Listing Guard không có endpoint thông tin catalog (chỉ `catalogVersion` và `rulesetVersion` trong mỗi kết quả). Nhờ Listing Guard thêm endpoint, hay chỉ hiển thị phiên bản lấy từ kết quả gần nhất?
- **Q10.** Màn 3 ghi "Marvel Labs sẽ được nhắc khi task gửi duyệt": kênh nhắc là gì (thông báo trong app, email)? Chưa có cơ chế thông báo nào.
- **Q11.** Có muốn vá riêng và sớm lỗ hổng "Seller tự đặt `APPROVED` qua `PUT /api/tasks/{id}`" (và kiểm quyền cho các endpoint preview/comment) trước P5 không? Hiện đang hở trên `main`.
- **Q12.** Thêm công cụ test: Testcontainers cho test migration trên PostgreSQL thật (cần Docker ở máy dev và CI) và Vitest cho frontend (hiện chưa có test frontend nào)?
- **Q13.** Bản ghi nội dung: giữ mọi lần upload là một `Preview` mới (lịch sử) hay sửa tại chỗ (một nội dung hiện hành, `version` tăng)? Kế hoạch P1 giả định "preview hiện hành là bản mới nhất, text sửa tại chỗ".

## 7. PR 0 đã làm (`chore/cleanup-before-ui`)

- Gỡ 5 file log và JSON khỏi git, cập nhật `.gitignore` (và bỏ `claude.md` khỏi gitignore để commit CLAUDE.md).
- Bỏ `jwt.secret` mặc định ở cả `application.yml` và `JwtTokenProvider`; thiếu hoặc ngắn hơn 64 byte thì app dừng với thông báo tiếng Việt. Cập nhật `.env.example`.
- Flyway: V1 khớp từng cột và kiểu với schema entity JPA sinh ra, cộng default, CHECK, FK cascade, index và trigger của DB dev. Kiểm: DB trống chạy V1 và Hibernate `validate` pass; schema tạo từ V1 trùng DB dev; DB dev được baseline V1 và app khởi động được. `ddl-auto: validate`, `baseline-on-migrate`, test profile tắt Flyway.
- Tắt `show-sql`. Bỏ mount `init.sql` khỏi docker-compose.
- Sửa test đỏ (`AmazonScraperServiceTest`, và lỗi thật ở `CreatePreviewUseCaseImpl` lưu trước khi kiểm), sửa 40 lỗi lint.
- Viết lại README, thêm CLAUDE.md và tài liệu này.
