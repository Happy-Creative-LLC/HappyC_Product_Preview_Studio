package com.happycreative.productpreview.entity;

public enum TaskStatus {
    PENDING_UPLOADS,  // Chờ upload nội dung
    IN_REVIEW,        // Đang được review
    APPROVED,         // Đã duyệt
    REJECTED          // Bị từ chối, cần chỉnh sửa lại
}
