package com.happycreative.productpreview.controller;

import com.happycreative.productpreview.application.preview.CreatePreviewCommand;
import com.happycreative.productpreview.application.preview.CreatePreviewUseCase;
import com.happycreative.productpreview.application.preview.GetPreviewUseCase;
import com.happycreative.productpreview.application.preview.dto.PreviewDto;
import com.happycreative.productpreview.domain.preview.PreviewId;
import com.happycreative.productpreview.security.CustomUserDetails;
import com.happycreative.productpreview.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Dùng {@code addFilters = false} để tắt hẳn security filter chain thật (JWT filter)
 * — chỉ cần kiểm hành vi của controller, không cần một request JWT thật.
 * {@code @AuthenticationPrincipal} vẫn cần được resolve nên ta đăng ký thủ công
 * {@link AuthenticationPrincipalArgumentResolver} qua {@link TestConfig} và tự set
 * {@link SecurityContextHolder} ở mỗi test, thay vì phụ thuộc auto-config đầy đủ của
 * Spring Security (không được nạp trong slice {@code @WebMvcTest}).
 */
@WebMvcTest(
        controllers = PreviewController.class,
        // JwtAuthenticationFilter là @Component nên WebMvcTypeExcludeFilter mặc định vẫn
        // đưa nó vào slice context (vì nó là một Filter) dù addFilters=false chỉ tắt việc
        // áp filter vào MockMvc, không tắt việc khởi tạo bean. Bean này cần JwtTokenProvider
        // (không có trong slice) nên phải loại nó khỏi component scan ở đây.
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
)
@AutoConfigureMockMvc(addFilters = false)
@Import(PreviewControllerTest.TestConfig.class)
class PreviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreatePreviewUseCase createPreviewUseCase;

    @MockitoBean
    private GetPreviewUseCase getPreviewUseCase;

    private UUID authenticatedUserId;

    @TestConfiguration
    static class TestConfig {
        @Bean
        WebMvcConfigurer authenticationPrincipalResolverConfigurer() {
            return new WebMvcConfigurer() {
                @Override
                public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
                    resolvers.add(new AuthenticationPrincipalArgumentResolver());
                }
            };
        }
    }

    @BeforeEach
    void setUpAuthentication() {
        authenticatedUserId = UUID.randomUUID();
        CustomUserDetails principal = mock(CustomUserDetails.class);
        when(principal.getUserId()).thenReturn(authenticatedUserId);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, List.of()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private PreviewDto samplePreviewDto(UUID id) {
        PreviewDto dto = new PreviewDto();
        dto.id = id;
        dto.version = 1;
        dto.status = "DRAFT";
        dto.productData = "{\"title\":\"Sample\"}";
        dto.ownerId = authenticatedUserId;
        dto.taskId = UUID.randomUUID();
        dto.createdAt = LocalDateTime.now();
        dto.updatedAt = LocalDateTime.now();
        return dto;
    }

    @Test
    void uploadPreview_withLegacyVideoKeyOnly_mergesIntoSingleElementList() throws Exception {
        MockMultipartFile legacyVideo = new MockMultipartFile(
                "video", "old.mp4", "video/mp4", "legacy-content".getBytes(StandardCharsets.UTF_8));
        when(createPreviewUseCase.execute(any())).thenReturn(samplePreviewDto(UUID.randomUUID()));

        mockMvc.perform(multipart("/api/previews/upload")
                        .file(legacyVideo)
                        .param("taskId", UUID.randomUUID().toString())
                        .param("platform", "AMAZON")
                        .param("title", "Some title"))
                .andExpect(status().isOk());

        ArgumentCaptor<CreatePreviewCommand> captor = ArgumentCaptor.forClass(CreatePreviewCommand.class);
        verify(createPreviewUseCase).execute(captor.capture());
        assertEquals(1, captor.getValue().videos.size());
        assertEquals("old.mp4", captor.getValue().videos.get(0).getOriginalFilename());
    }

    @Test
    void uploadPreview_withLegacyAndNewVideoKeys_mergesInOrder() throws Exception {
        MockMultipartFile legacyVideo = new MockMultipartFile(
                "video", "old.mp4", "video/mp4", "legacy-content".getBytes(StandardCharsets.UTF_8));
        MockMultipartFile newVideo1 = new MockMultipartFile(
                "videos", "new1.mp4", "video/mp4", "new1-content".getBytes(StandardCharsets.UTF_8));
        MockMultipartFile newVideo2 = new MockMultipartFile(
                "videos", "new2.mp4", "video/mp4", "new2-content".getBytes(StandardCharsets.UTF_8));
        when(createPreviewUseCase.execute(any())).thenReturn(samplePreviewDto(UUID.randomUUID()));

        mockMvc.perform(multipart("/api/previews/upload")
                        .file(legacyVideo)
                        .file(newVideo1)
                        .file(newVideo2)
                        .param("taskId", UUID.randomUUID().toString())
                        .param("platform", "AMAZON")
                        .param("title", "Some title"))
                .andExpect(status().isOk());

        ArgumentCaptor<CreatePreviewCommand> captor = ArgumentCaptor.forClass(CreatePreviewCommand.class);
        verify(createPreviewUseCase).execute(captor.capture());
        List<org.springframework.web.multipart.MultipartFile> videos = captor.getValue().videos;
        assertEquals(3, videos.size());
        assertEquals("old.mp4", videos.get(0).getOriginalFilename());
        assertEquals("new1.mp4", videos.get(1).getOriginalFilename());
        assertEquals("new2.mp4", videos.get(2).getOriginalFilename());
    }

    @Test
    void uploadPreview_withNoVideo_producesEmptyNonNullList() throws Exception {
        when(createPreviewUseCase.execute(any())).thenReturn(samplePreviewDto(UUID.randomUUID()));

        mockMvc.perform(multipart("/api/previews/upload")
                        .param("taskId", UUID.randomUUID().toString())
                        .param("platform", "AMAZON")
                        .param("title", "Some title"))
                .andExpect(status().isOk());

        ArgumentCaptor<CreatePreviewCommand> captor = ArgumentCaptor.forClass(CreatePreviewCommand.class);
        verify(createPreviewUseCase).execute(captor.capture());
        assertNotNull(captor.getValue().videos);
        assertTrue(captor.getValue().videos.isEmpty());
    }

    @Test
    void importPreview_passesAsinAndNullTitle() throws Exception {
        String asin = "B000TESTASIN";
        UUID taskId = UUID.randomUUID();
        when(createPreviewUseCase.execute(any())).thenReturn(samplePreviewDto(UUID.randomUUID()));

        mockMvc.perform(post("/api/previews/import")
                        .param("taskId", taskId.toString())
                        .param("platform", "AMAZON")
                        .param("asin", asin))
                .andExpect(status().isOk());

        ArgumentCaptor<CreatePreviewCommand> captor = ArgumentCaptor.forClass(CreatePreviewCommand.class);
        verify(createPreviewUseCase).execute(captor.capture());
        assertEquals(asin, captor.getValue().asin);
        assertNull(captor.getValue().title);
    }

    @Test
    void getPreview_whenFound_returns200WithId() throws Exception {
        UUID id = UUID.randomUUID();
        when(getPreviewUseCase.execute(PreviewId.of(id))).thenReturn(samplePreviewDto(id));

        mockMvc.perform(get("/api/previews/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    void getPreview_whenNotFound_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(getPreviewUseCase.execute(PreviewId.of(id))).thenReturn(null);

        mockMvc.perform(get("/api/previews/{id}", id))
                .andExpect(status().isNotFound());
    }
}
