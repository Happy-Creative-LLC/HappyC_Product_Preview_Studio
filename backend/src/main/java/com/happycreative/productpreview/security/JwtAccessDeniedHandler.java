package com.happycreative.productpreview.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.happycreative.productpreview.dto.ApiErrorResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

@Component
@RequiredArgsConstructor
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException, ServletException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(),
                HttpServletResponse.SC_FORBIDDEN,
                "Forbidden",
                "Bạn không có quyền thực hiện thao tác này.",
                request.getRequestURI());
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
