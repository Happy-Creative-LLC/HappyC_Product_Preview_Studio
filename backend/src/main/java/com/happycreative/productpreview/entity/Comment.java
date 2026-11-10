package com.happycreative.productpreview.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
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
    @JoinColumn(name = "preview_id")
    private Preview preview;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Comment parentComment;

    @OneToMany(mappedBy = "parentComment")
    @OrderBy("createdAt ASC")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Comment> replies = new LinkedHashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // Snapshot role tại thời điểm comment (ADMIN/MARVEL/SELLER/PRODUCT_DESIGN)
    @Column(nullable = false)
    private String authorRole;

    // Tất cả comment thuộc cùng một luồng của task.
    @Column(nullable = false)
    private String audience = "TASK";

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "comment_mentions",
            joinColumns = @JoinColumn(name = "comment_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<User> mentions = new LinkedHashSet<>();

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
