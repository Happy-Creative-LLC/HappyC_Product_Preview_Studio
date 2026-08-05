package com.happycreative.productpreview.repository;

import com.happycreative.productpreview.entity.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {

    Optional<StoredFile> findByObjectKey(String objectKey);

    /**
     * Xóa theo object key bằng bulk delete để không phải nạp cột bytea vào bộ nhớ.
     */
    @Modifying
    @Query("delete from StoredFile f where f.objectKey = :objectKey")
    int deleteByObjectKey(@Param("objectKey") String objectKey);
}
