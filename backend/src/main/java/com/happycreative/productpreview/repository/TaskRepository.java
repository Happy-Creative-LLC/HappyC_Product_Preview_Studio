package com.happycreative.productpreview.repository;

import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.entity.TaskStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByProjectIdOrderByUpdatedAtDesc(UUID projectId);
    List<Task> findByProjectIdAndStatus(UUID projectId, TaskStatus status);
    long countByProjectIdAndStatus(UUID projectId, TaskStatus status);
    List<Task> findByCreatedById(UUID userId);

    /**
     * Khóa hàng task cho đến hết transaction. Các luồng ghi nội dung (lưu Text, upload media) gọi trước khi
     * đọc preview của task để chạy lần lượt theo từng task; nhờ vậy hai request đầu tiên đến cùng lúc không
     * tạo hai preview song song.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Task t where t.id = :id")
    Optional<Task> findByIdForUpdate(@Param("id") UUID id);
}
