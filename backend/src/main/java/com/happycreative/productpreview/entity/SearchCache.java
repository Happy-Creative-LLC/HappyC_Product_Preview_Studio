package com.happycreative.productpreview.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

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

    @Column(columnDefinition = "TEXT", nullable = false)
    private String resultsJson;

    @Column(nullable = false)
    private LocalDateTime lastUpdated;
}
