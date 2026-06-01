package com.happycreative.productpreview.repository;

import com.happycreative.productpreview.entity.Preview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PreviewRepository extends JpaRepository<Preview, UUID> {
    List<Preview> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
