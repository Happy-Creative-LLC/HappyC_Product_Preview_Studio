package com.happycreative.productpreview.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preview_id", nullable = false)
    private Preview preview;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // Snapshot role tại thời điểm comment (ADMIN/MARVEL/SELLER/PRODUCT_DESIGN)
    @Column(nullable = false)
    private String authorRole;

    // IMAGE=đỏ(Design) | VIDEO=tím(Marvel) | TEXT=xanh(Seller) | APLUS | GENERAL
    @Column(nullable = false)
    private String targetComponent = "GENERAL";

    @Column(nullable = false)
    private boolean isResolved = false;

    // User đã duyệt resolved (nullable)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    private LocalDateTime resolvedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
