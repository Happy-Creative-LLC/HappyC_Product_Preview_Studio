package com.happycreative.productpreview.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preview_id", nullable = true)
    private Preview preview;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private String authorRole; // e.g. "SELLER", "DESIGN", "MEDIA"

    @Column(nullable = false)
    private boolean isResolved = false;

    @Column(nullable = false)
    private String targetComponent; // e.g. "IMAGE", "VIDEO", "TEXT"

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
