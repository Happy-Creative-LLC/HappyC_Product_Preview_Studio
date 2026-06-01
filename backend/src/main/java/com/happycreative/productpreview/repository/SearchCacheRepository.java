package com.happycreative.productpreview.repository;

import com.happycreative.productpreview.entity.SearchCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SearchCacheRepository extends JpaRepository<SearchCache, Long> {
    Optional<SearchCache> findByKeywordIgnoreCase(String keyword);
}
