package com.happycreative.productpreview.application.preview.impl;

import com.happycreative.productpreview.application.preview.GetPreviewUseCase;
import com.happycreative.productpreview.application.preview.dto.PreviewDto;
import com.happycreative.productpreview.domain.preview.PreviewId;
import com.happycreative.productpreview.domain.preview.PreviewRepository;
import com.happycreative.productpreview.infrastructure.preview.PreviewMapper;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class GetPreviewUseCaseImpl implements GetPreviewUseCase {
    private final PreviewRepository repository;
    private final PreviewMapper mapper;

    public GetPreviewUseCaseImpl(PreviewRepository repository, PreviewMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public PreviewDto execute(PreviewId id) {
        Optional<com.happycreative.productpreview.domain.preview.Preview> p = repository.findById(id);
        return p.map(mapper::toDto).orElse(null);
    }
}
