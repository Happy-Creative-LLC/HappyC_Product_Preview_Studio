package com.happycreative.productpreview.application.preview;

import java.util.UUID;

import com.happycreative.productpreview.application.preview.dto.PreviewDto;
import com.happycreative.productpreview.dto.TextContentRequest;
import com.happycreative.productpreview.security.CustomUserDetails;

public interface TaskTextContentUseCase {
    PreviewDto getCurrent(UUID taskId, CustomUserDetails actor);
    PreviewDto save(UUID taskId, TextContentRequest request, CustomUserDetails actor);
}
