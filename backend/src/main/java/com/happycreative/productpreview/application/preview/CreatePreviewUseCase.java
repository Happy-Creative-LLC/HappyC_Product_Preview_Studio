package com.happycreative.productpreview.application.preview;

import com.happycreative.productpreview.application.preview.dto.PreviewDto;

public interface CreatePreviewUseCase {
    PreviewDto execute(CreatePreviewCommand command);
}
