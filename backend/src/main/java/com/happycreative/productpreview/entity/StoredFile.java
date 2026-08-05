package com.happycreative.productpreview.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Media lưu thẳng trong Postgres — dùng cho giai đoạn test ({@code STORAGE_PROVIDER=db}).
 *
 * <p>Nhờ vậy ảnh/video demo đi theo volume Docker + {@code pg_dump} thay vì nằm rời
 * trong {@code backend/uploads/}. Production dùng Cloudflare R2 nên bảng này rỗng.</p>
 */
@Entity
@Table(name = "stored_files")
@Getter
@Setter
@NoArgsConstructor
public class StoredFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Ví dụ: {@code product-previews/2026/08/05/<uuid>.jpg} — khớp phần sau /uploads/ của URL. */
    @Column(name = "object_key", nullable = false, unique = true, length = 500)
    private String objectKey;

    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    @Column(name = "content_type", length = 150)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    /** Hibernate map byte[] sang bytea trên PostgreSQL (xem database/init.sql). */
    @Column(name = "data", nullable = false)
    private byte[] data;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
