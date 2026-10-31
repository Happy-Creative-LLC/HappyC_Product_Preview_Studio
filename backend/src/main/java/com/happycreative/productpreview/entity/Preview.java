package com.happycreative.productpreview.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "previews")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Preview {

    // Id do domain gán (Preview.create dùng UUID.randomUUID()). Không dùng @GeneratedValue: với id đã
    // gán sẵn, save() chạy merge và Hibernate ném StaleObjectStateException cho entity chưa có trong DB.
    @Id
    private UUID id;

    // nullable trong giai đoạn chuyển tiếp — Sprint 1 sẽ bắt buộc
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Platform platform = Platform.AMAZON;

    // JSON structure: { title, brand, price, description, fabricType,
    //   careInstructions, origin, bulletPoints[], images[], videos[],
    //   aPlusImages[], colors[], sizes[] }
    // Amazon: tối đa 7 ảnh | Etsy: tối đa 20 ảnh | Cả hai: tối đa 1 video
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String productData;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PreviewStatus status = PreviewStatus.DRAFT;

    @Column(nullable = false)
    private int version = 1;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "preview", cascade = CascadeType.REMOVE, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Comment> comments;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
