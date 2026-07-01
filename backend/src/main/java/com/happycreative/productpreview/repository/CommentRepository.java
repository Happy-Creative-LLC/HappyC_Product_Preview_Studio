package com.happycreative.productpreview.repository;

import com.happycreative.productpreview.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, java.util.UUID> {
    List<Comment> findByPreview_IdOrderByCreatedAtAsc(java.util.UUID previewId);
    List<Comment> findByPreview_IdAndTargetComponentOrderByCreatedAtAsc(java.util.UUID previewId, String targetComponent);
    long countByPreview_Id(java.util.UUID previewId);
}
