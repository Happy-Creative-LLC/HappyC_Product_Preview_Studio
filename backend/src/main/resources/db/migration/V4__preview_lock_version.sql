-- Khóa lạc quan cho previews: Hibernate tăng lock_version mỗi lần UPDATE và từ chối ghi khi hàng đã bị
-- request khác sửa trước. Tách khỏi cột version (số phiên bản nội dung hiển thị cho người dùng).
ALTER TABLE public.previews ADD COLUMN lock_version bigint NOT NULL DEFAULT 0;
