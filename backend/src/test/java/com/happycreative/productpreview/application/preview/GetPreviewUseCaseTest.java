package com.happycreative.productpreview.application.preview;

import com.happycreative.productpreview.application.preview.dto.PreviewDto;
import com.happycreative.productpreview.application.preview.impl.GetPreviewUseCaseImpl;
import com.happycreative.productpreview.domain.preview.Preview;
import com.happycreative.productpreview.domain.preview.PreviewId;
import com.happycreative.productpreview.domain.preview.ProductData;
import com.happycreative.productpreview.domain.preview.PreviewRepository;
import com.happycreative.productpreview.infrastructure.preview.PreviewMapper;

import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class GetPreviewUseCaseTest {
    @Test
    void returnsPreviewDtoWhenFound() {
        UUID id = UUID.randomUUID();
        ProductData pd = new ProductData("{\"title\":\"Test product\"}");
        Preview domain = Preview.create(id, com.happycreative.productpreview.domain.preview.PreviewPlatform.AMAZON,
                UUID.randomUUID(), null, pd);

        PreviewRepository repo = new PreviewRepository() {
            @Override public Optional<Preview> findById(PreviewId id) { return Optional.of(domain); }
            @Override public java.util.List<Preview> findByTaskId(java.util.UUID taskId) { return java.util.List.of(domain); }
            @Override public void save(Preview preview) {}
            @Override public void delete(PreviewId id) {}
        };

        GetPreviewUseCaseImpl useCase = new GetPreviewUseCaseImpl(repo, new PreviewMapper());
        PreviewDto dto = useCase.execute(PreviewId.of(id));
        assertNotNull(dto);
        assertEquals(id, dto.id);
        assertEquals("DRAFT", dto.status);
    }

    @Test
    void returnsNullWhenPreviewNotFound() {
        UUID id = UUID.randomUUID();

        PreviewRepository repo = new PreviewRepository() {
            @Override public Optional<Preview> findById(PreviewId id) { return Optional.empty(); }
            @Override public java.util.List<Preview> findByTaskId(java.util.UUID taskId) { return java.util.List.of(); }
            @Override public void save(Preview preview) {}
            @Override public void delete(PreviewId id) {}
        };

        GetPreviewUseCaseImpl useCase = new GetPreviewUseCaseImpl(repo, new PreviewMapper());
        PreviewDto dto = useCase.execute(PreviewId.of(id));
        assertNull(dto);
    }
}
