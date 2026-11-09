package com.happycreative.productpreview.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.happycreative.productpreview.entity.TaskEvent;

public interface TaskEventRepository extends JpaRepository<TaskEvent, UUID> {
}
