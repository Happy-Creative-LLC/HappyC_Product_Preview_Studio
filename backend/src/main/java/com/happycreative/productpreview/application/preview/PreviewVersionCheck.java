package com.happycreative.productpreview.application.preview;

import java.util.List;

import com.happycreative.productpreview.domain.preview.Preview;
import com.happycreative.productpreview.exception.PreviewConflictException;

/**
 * Kiểm version mà client đã tải so với preview hiện hành của task. Lệch thì ném 409 để client tải lại nội dung
 * hiện hành rồi lưu lại. Gọi sau khi đã khóa hàng task, nên không còn request khác chen giữa lúc kiểm và lúc ghi.
 */
public final class PreviewVersionCheck {

    private PreviewVersionCheck() {
    }

    /**
     * @param previews        kết quả {@code findByTaskId}, bản hiện hành đứng đầu
     * @param expectedVersion version client đã tải; null nghĩa là client chưa thấy preview nào của task
     */
    public static void require(List<Preview> previews, Integer expectedVersion) {
        if (previews.isEmpty()) {
            if (expectedVersion != null) {
                throw new PreviewConflictException();
            }
            return;
        }
        if (expectedVersion == null || expectedVersion.intValue() != previews.getFirst().getVersion()) {
            throw new PreviewConflictException();
        }
    }
}
