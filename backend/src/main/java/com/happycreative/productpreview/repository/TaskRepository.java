package com.happycreative.productpreview.repository;

import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByProjectIdOrderByUpdatedAtDesc(UUID projectId);
    List<Task> findByProjectIdAndStatus(UUID projectId, TaskStatus status);
    long countByProjectIdAndStatus(UUID projectId, TaskStatus status);
    List<Task> findByCreatedById(UUID userId);
}
