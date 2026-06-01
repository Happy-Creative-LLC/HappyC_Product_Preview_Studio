# Software Requirements Specification (SRS)
## Happy Creative - Product Preview Search Site

### 1. Giới thiệu
**1.1. Mục đích**
Hệ thống Product Preview Search Site là một ứng dụng nội bộ nhằm hỗ trợ quá trình xem trước tổng quan thông tin sản phẩm trên nền tảng thương mại điện tử (Amazon, Etsy). Hệ thống mô phỏng giao diện trang chi tiết và trang tìm kiếm sản phẩm để các bộ phận (Design, Media, Seller) có thể kiểm tra hình ảnh, nội dung, video thực tế trước khi đăng tải chính thức.

**1.2. Phạm vi**
Hệ thống sẽ bao gồm:
- Giao diện mô phỏng Amazon (Website & Mobile) cho 3 case hiển thị khác nhau.
- Giao diện mô phỏng Etsy (Website & Mobile).
- Trang tìm kiếm Amazon có khả năng chèn sản phẩm custom để so sánh với đối thủ thời gian thực.

### 2. Luồng hoạt động & Phân quyền (Company's Workflow)
Mặc dù giao diện giống Amazon/Etsy, luồng hoạt động là **luồng nội bộ (Internal Workflow)** nhằm mục đích phối hợp giữa các phòng ban:

- **Product Design Team:** Tải lên, chỉnh sửa, xóa Hình ảnh sản phẩm và A+ Content.
- **Marvel Labs (Media):** Tải lên, chỉnh sửa, xóa Video sản phẩm.
- **Seller:** 
  - Tải lên, chỉnh sửa, xóa Text (Tiêu đề, bullet points, mô tả,...).
  - Có quyền **Comment** trên tất cả mọi thành phần (ảnh, video, text) để phản hồi cho Design và Media.
  - Tích hợp thông tin sản phẩm của công ty vào trang tìm kiếm để so sánh.
*Lưu ý: Các bộ phận (Design, Media) chỉ có quyền phản hồi comment liên quan đến khu vực thao tác của mình.*

### 3. Yêu cầu chức năng
**3.1. Phân hệ Giao diện mô phỏng (Amazon & Etsy)**
- **Mô phỏng chính xác giao diện Amazon:** 
  - *Case 1:* Ngành hàng Clothing, Shoes & Jewelry (7 ảnh hoặc 6 ảnh + 1 Video).
  - *Case 2:* Ngành hàng Home & Kitchen (Danh sách ảnh DỌC).
  - *Case 3:* Ngành hàng Home & Kitchen (Danh sách ảnh NGANG).
- **Mô phỏng giao diện Etsy:** Hỗ trợ tối đa 20 ảnh + 1 Video.
- **Hiển thị Responsive:** Hỗ trợ cả giao diện Website và Mobile cho các nền tảng trên.

**3.2. Phân hệ Phối hợp & Comment**
- Hệ thống comment real-time hoặc notification cho các thay đổi.
- Cấp quyền truy cập thao tác (click, edit) dựa trên Role của người đăng nhập.

**3.3. Phân hệ Tìm kiếm (Amazon Product Search Page)**
- Gọi dữ liệu thời gian thực từ Amazon theo từ khóa tìm kiếm.
- Cho phép Seller "chèn" sản phẩm đang preview vào danh sách kết quả tìm kiếm (thay thế Ảnh, Tên, Giá, Shipping,...) để so sánh visual trực quan với các đối thủ cạnh tranh.

### 4. Yêu cầu phi chức năng
- **Bảo mật:** Hệ thống nội bộ cần login, xác thực JWT.
- **Hiệu suất:** Tốc độ load ảnh/video cần tối ưu (sử dụng CDN như Cloudinary).
- **Tính khả dụng:** Giao diện cần trung thực nhất với Amazon/Etsy tại thời điểm hiện tại (sử dụng hồ sơ trình duyệt trắng để đảm bảo không bị ảnh hưởng bởi extensions).
