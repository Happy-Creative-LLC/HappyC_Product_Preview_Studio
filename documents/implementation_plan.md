# Implementation Plan: Product Preview Search Site

Dự án này nhằm xây dựng một hệ thống giả lập giao diện Amazon và Etsy để các team (Design, Media, Seller) nội bộ của công ty có thể xem trước, phối hợp và tối ưu nội dung sản phẩm trước khi đăng tải chính thức.

## 1. Đánh giá & Tối ưu Công nghệ (Dựa trên Tech-Guide)

Dựa trên tài liệu `TECH-GUIDE-Solo-Dev-Amazon-Clone.docx`, dưới đây là đánh giá tính hiệu quả và tối ưu của stack công nghệ được đề xuất:

> [!TIP]
> **Đánh giá tổng quan:** Tech stack đề xuất (Spring Boot + React + Vite) rất phù hợp cho một dự án cần tính module hóa cao ở Frontend và bảo mật phân quyền chặt chẽ ở Backend.

### Frontend: React + Vite + Zustand + TailwindCSS
- **Hiệu quả:** Tuyệt vời. Giao diện Amazon/Etsy có rất nhiều component phức tạp (Buy Box, Image Gallery, Video Player, Carousel). React giúp chia nhỏ và tái sử dụng component dễ dàng. Vite mang lại tốc độ build cực nhanh cho dev.
- **Tối ưu State Management:** Dùng Zustand thay vì Redux là một bước đi thông minh cho Solo-Dev hoặc team nhỏ vì nó gọn nhẹ, ít boilerplate, hoàn toàn đủ dùng để quản lý state (Auth, Preview State).
- **Styling:** TailwindCSS sẽ giúp "clone" lại giao diện của Amazon/Etsy một cách pixel-perfect một cách nhanh nhất nhờ utility-classes.

### Backend: Spring Boot (Java) + PostgreSQL
- **Hiệu quả:** Spring Boot cung cấp kiến trúc MVC rõ ràng, Spring Security + JWT xử lý việc phân quyền (Design, Media, Seller) cực kỳ an toàn và chặt chẽ.
- **Tối ưu:** Tuy cấu hình ban đầu có thể tốn thời gian, nhưng mang lại tính ổn định và khả năng mở rộng cao cho một dự án triển khai từ đầu (build from scratch) theo đúng định hướng Tech-Guide.

### Storage: Cloudinary
- **Hiệu quả:** Rất tối ưu. Hệ thống chủ yếu thao tác với Hình ảnh và Video độ phân giải cao. Cloudinary tự động tối ưu hóa (`q_auto, f_auto`) giúp giảm băng thông và tăng tốc độ load trang, tránh làm sập server tự host.

### Nguồn dữ liệu Amazon (Thay thế PA-API v5)
- **Giải pháp:** Vì PA-API yêu cầu tài khoản Amazon Associates Affiliate (cần xét duyệt và có website đang hoạt động), phương án tối ưu nhất là sử dụng **Third-party Scraper API (như Rainforest API hoặc RapidAPI Amazon Scraper)**. Các dịch vụ này cung cấp API lấy dữ liệu Amazon real-time với cấu trúc JSON chuẩn, có gói miễn phí (free tier) rất phù hợp cho dự án nội bộ. Trong giai đoạn đầu, hệ thống sẽ dùng **Mock Data** để test UI.

---

## 2. Cấu trúc thư mục (Monorepo - Tách biệt Frontend & Backend)
Do tính chất của Spring Boot (quản lý bằng Maven/Gradle) và React (quản lý bằng NPM), giải pháp tối ưu nhất là tạo một thư mục dự án gốc (Root folder), bên trong chứa 2 thư mục con tách biệt:
- `backend/`: Chứa mã nguồn Spring Boot.
- `frontend/`: Chứa mã nguồn React + Vite.
Việc này giúp source code không bị lẫn lộn, quản lý package dễ dàng và tiện lợi khi deploy lên các nền tảng khác nhau (Railway cho Backend, Vercel cho Frontend).

## 3. Kế hoạch triển khai (Theo hạng mục)
### Phase 1: Setup & Foundation (Tuần 1)
- **Backend:** Khởi tạo project Spring Boot, thiết lập PostgreSQL.
- **Auth:** Xây dựng hệ thống User, Role (Design, Media, Seller, Admin) và JWT Authentication.
- **Media:** Tích hợp Cloudinary SDK để xử lý upload Hình ảnh và Video.
- **Frontend:** Khởi tạo Vite + React, setup routing, Zustand, Axios interceptor.

### Phase 2: UI Cloning - Amazon & Etsy Mockups (Tuần 2)
- **Amazon Web & Mobile:** 
  - Build Layout 3 Case (Quần áo, Đồ gia dụng ảnh dọc, Đồ gia dụng ảnh ngang).
  - Build components: Header, Product Image Gallery (zoom khi hover), Video Player, Bullet points, Buy box.
- **Etsy Web & Mobile:**
  - Build Layout chi tiết sản phẩm tối đa 20 ảnh + 1 video.
- Dùng dummy data để đảm bảo UI pixel-perfect.

### Phase 3: Core Features - Tương tác và Upload (Tuần 3)
- **Upload Flow:**
  - **Design Team:** Tính năng upload/quản lý hình ảnh, kéo thả thay đổi vị trí ảnh.
  - **Media Team:** Tính năng upload/quản lý video.
  - **Seller Team:** Form nhập liệu Title, Bullet points, Description.
- **Real-time Preview:** Cập nhật ngay lập tức dữ liệu vừa nhập/upload vào Layout mô phỏng.

### Phase 4: Collaboration & Workflow System (Tuần 4)
- Xây dựng hệ thống Comment trên từng component (Ảnh, Text, Video).
- Phân quyền hiển thị comment (Design chỉ thấy comment về ảnh, Media về video).
- Tính năng Approve / Reject bản nháp sản phẩm từ Seller.

### Phase 5: Search Page Simulation & Third-Party API (Tuần 5)
- Đăng ký và tích hợp Third-party API (Rainforest API / RapidAPI) vào Spring Boot để kéo kết quả search từ Amazon thời gian thực.
- Xây dựng UI Search Page của Amazon.
- Tính năng **Injection (Chèn)**: Cho phép Seller lấy một sản phẩm đang preview và chèn đè vào danh sách kết quả tìm kiếm trả về từ API, để so sánh trực quan độ nổi bật.

### Phase 6: Testing & Deployment
- Testing UI trên hồ sơ Chrome trắng (không extension).
- Deploy Backend lên Railway.
- Deploy Frontend lên Vercel.

---

## User Review Required
> [!IMPORTANT]
> Tôi đã cập nhật lại kế hoạch với các quyết định của bạn:
> 1. Chốt sử dụng tech stack **Spring Boot + React**.
> 2. Cấu trúc thư mục tách riêng **`frontend/`** và **`backend/`**.
> 3. Giải pháp dùng **Third-party API (RapidAPI/Rainforest API)** thay thế cho Amazon PA-API, kết hợp với mock data.
> 
> Nếu bạn đã hoàn toàn đồng ý với kế hoạch này, xin hãy xác nhận (Approve) để chúng ta bắt đầu thực thi **Phase 1: Khởi tạo Project & Setup Cấu trúc**.
