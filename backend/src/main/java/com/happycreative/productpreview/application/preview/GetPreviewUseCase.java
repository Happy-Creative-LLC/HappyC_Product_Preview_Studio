package com.happycreative.productpreview.application.preview;

import com.happycreative.productpreview.application.preview.dto.PreviewDto;
import com.happycreative.productpreview.domain.preview.PreviewId;

public interface GetPreviewUseCase {
    PreviewDto execute(PreviewId id);
}
