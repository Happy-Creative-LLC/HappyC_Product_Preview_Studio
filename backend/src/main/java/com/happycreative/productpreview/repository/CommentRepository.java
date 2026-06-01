package com.happycreative.productpreview.repository;

import com.happycreative.productpreview.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTargetComponentOrderByCreatedAtDesc(String targetComponent);
    List<Comment> findAllByOrderByCreatedAtDesc();
}
