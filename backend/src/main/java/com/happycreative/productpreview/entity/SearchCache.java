package com.happycreative.productpreview.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "search_cache")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String keyword;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String resultsJson;

    // Instant (mốc thời gian tuyệt đối, cột timestamptz) — KHÔNG dùng LocalDateTime:
    // JVM chạy giờ VN (+07:00) còn Postgres session TimeZone=UTC, LocalDateTime.now()
    // ghi lệch ~7h so với now() của Postgres, khiến check "cache còn hạn" luôn sai và
    // mọi lượt search đều gọi lại RapidAPI dù cache vừa tạo xong.
    @Column(nullable = false)
    private Instant lastUpdated;
}
