package com.happycreative.productpreview.infrastructure.preview;

import com.happycreative.productpreview.domain.preview.Preview;
import com.happycreative.productpreview.domain.preview.PreviewId;
import com.happycreative.productpreview.domain.preview.PreviewRepository;
import com.happycreative.productpreview.domain.preview.ProductData;
import com.happycreative.productpreview.repository.UserRepository;
import com.happycreative.productpreview.repository.TaskRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class JpaPreviewRepositoryAdapter implements PreviewRepository {

    private final com.happycreative.productpreview.repository.PreviewRepository jpaRepo;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    public JpaPreviewRepositoryAdapter(com.happycreative.productpreview.repository.PreviewRepository jpaRepo,
                                      UserRepository userRepository,
                                      TaskRepository taskRepository) {
        this.jpaRepo = jpaRepo;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Preview> findById(PreviewId id) {
        return jpaRepo.findById(id.toUUID()).map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Preview> findByTaskId(UUID taskId) {
        return jpaRepo.findAll().stream()
                .filter(e -> e.getTask() != null && taskId.equals(e.getTask().getId()))
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void save(Preview preview) {
        com.happycreative.productpreview.entity.Preview entity = null;
        if (preview.getId() != null) {
            Optional<com.happycreative.productpreview.entity.Preview> existing = jpaRepo.findById(preview.getId().toUUID());
            entity = existing.orElseGet(com.happycreative.productpreview.entity.Preview::new);
        } else {
            entity = new com.happycreative.productpreview.entity.Preview();
        }

        if (preview.getId() != null) entity.setId(preview.getId().toUUID());
        entity.setVersion(preview.getVersion());
        entity.setStatus(com.happycreative.productpreview.entity.PreviewStatus.valueOf(preview.getStatus().name()));
        entity.setProductData(preview.getProductData() == null ? null : preview.getProductData().toJson());
        entity.setCreatedAt(preview.getCreatedAt());
        entity.setUpdatedAt(preview.getUpdatedAt());

        if (preview.getPlatform() != null) {
            entity.setPlatform(com.happycreative.productpreview.entity.Platform.valueOf(preview.getPlatform().name()));
        }
        if (preview.getOwnerId() != null) {
            userRepository.findById(preview.getOwnerId()).ifPresent(entity::setUser);
        }
        if (preview.getTaskId() != null) {
            taskRepository.findById(preview.getTaskId()).ifPresent(entity::setTask);
        }

        jpaRepo.save(entity);
    }

    @Override
    @Transactional
    public void delete(PreviewId id) {
        jpaRepo.deleteById(id.toUUID());
    }

    private Preview toDomain(com.happycreative.productpreview.entity.Preview e) {
        ProductData pd = e.getProductData() == null ? null : ProductData.fromJson(e.getProductData());
        java.util.UUID ownerId = e.getUser() != null ? e.getUser().getId() : null;
        java.util.UUID taskId = e.getTask() != null ? e.getTask().getId() : null;
        return Preview.reconstitute(
                PreviewId.of(e.getId()),
                e.getVersion(),
                com.happycreative.productpreview.domain.preview.PreviewStatus.valueOf(e.getStatus().name()),
                com.happycreative.productpreview.domain.preview.PreviewPlatform.fromString(e.getPlatform().name()),
                pd,
                ownerId,
                taskId,
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
