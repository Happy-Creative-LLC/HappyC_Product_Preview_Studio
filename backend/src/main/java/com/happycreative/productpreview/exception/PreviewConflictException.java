package com.happycreative.productpreview.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Nội dung preview đã bị request khác cập nhật trước (khóa lạc quan): trả 409 để client tải lại rồi lưu lại. */
public class PreviewConflictException extends ResponseStatusException {

    public static final String MESSAGE =
            "Nội dung vừa được cập nhật ở nơi khác. Hãy tải lại nội dung hiện hành rồi lưu lại.";

    public PreviewConflictException() {
        super(HttpStatus.CONFLICT, MESSAGE);
    }
}
