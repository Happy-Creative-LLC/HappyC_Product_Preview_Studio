package com.happycreative.productpreview.domain.preview;

import java.util.List;
import java.util.Optional;

public interface PreviewRepository {
    Optional<Preview> findById(PreviewId id);
    List<Preview> findByTaskId(java.util.UUID taskId);
    void save(Preview preview);
    void delete(PreviewId id);
}
