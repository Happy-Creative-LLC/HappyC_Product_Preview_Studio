package com.happycreative.productpreview.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.happycreative.productpreview.entity.Platform;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.entity.TaskStatus;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.repository.ProjectRepository;
import com.happycreative.productpreview.repository.TaskRepository;
import com.happycreative.productpreview.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Phân quyền phía server qua HTTP thật (filter chain, JWT, PostgreSQL): không dựa vào việc frontend ẩn nút.
 * Cần Docker. Project lấy từ migration V2; mỗi vai trò có một user riêng trong project happy và creative.
 */
@SpringBootTest(properties = "jwt.secret=test-only-jwt-secret-not-for-real-use-0123456789-abcdefghijklmnopqrstuvwxyz")
@AutoConfigureMockMvc
@Testcontainers
class AuthorizationApiTest {

    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:15-alpine");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private TaskRepository taskRepository;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private ObjectMapper objectMapper;

    private static String admin;
    private static String marvel;
    private static String sellerHappy;
    private static String sellerCreative;
    private static String pdHappy;
    private static String pdCreative;

    @BeforeEach
    void users() {
        if (admin != null) {
            return;
        }
        admin = tokenOf(Role.ADMIN, null);
        marvel = tokenOf(Role.MARVEL, null);
        sellerHappy = tokenOf(Role.SELLER, "happy");
        sellerCreative = tokenOf(Role.SELLER, "creative");
        pdHappy = tokenOf(Role.PRODUCT_DESIGN, "happy");
        pdCreative = tokenOf(Role.PRODUCT_DESIGN, "creative");
    }

    // ---------- PUT /api/tasks/{id}: đổi trạng thái ----------

    @Test
    void sellerCanOnlySubmitOwnPendingTaskForReview() throws Exception {
        Task task = newTask("happy");

        updateStatus(sellerHappy, task, "APPROVED", 403);
        updateStatus(sellerHappy, task, "REJECTED", 403);
        assertEquals(TaskStatus.PENDING_UPLOADS, reload(task).getStatus());

        updateStatus(sellerHappy, task, "IN_REVIEW", 200);
        assertEquals(TaskStatus.IN_REVIEW, reload(task).getStatus());

        updateStatus(sellerHappy, task, "PENDING_UPLOADS", 403);
        updateStatus(sellerHappy, task, "APPROVED", 403);
        assertEquals(TaskStatus.IN_REVIEW, reload(task).getStatus());
    }

    @Test
    void otherRolesAndOtherProjectsCannotChangeStatus() throws Exception {
        Task task = newTask("happy");

        updateStatus(sellerCreative, task, "IN_REVIEW", 403);
        updateStatus(pdHappy, task, "IN_REVIEW", 403);
        updateStatus(marvel, task, "IN_REVIEW", 403);
        assertEquals(TaskStatus.PENDING_UPLOADS, reload(task).getStatus());
    }

    @Test
    void onlyAdminCanApproveOrReject() throws Exception {
        Task task = newTask("happy");

        updateStatus(admin, task, "APPROVED", 200);
        assertEquals(TaskStatus.APPROVED, reload(task).getStatus());
        updateStatus(admin, task, "REJECTED", 200);
        assertEquals(TaskStatus.REJECTED, reload(task).getStatus());
    }

    // ---------- upload preview: vùng theo vai trò ----------

    @Test
    void sellerWritesTextButNotImagesOrVideo() throws Exception {
        Task task = newTask("happy");

        upload(sellerHappy, task, 200, Part.TEXT);
        upload(sellerHappy, task, 403, Part.TEXT, Part.IMAGE);
        upload(sellerHappy, task, 403, Part.TEXT, Part.VIDEO);
    }

    @Test
    void productDesignWritesImagesButNotTextOrVideo() throws Exception {
        Task task = newTask("happy");

        upload(pdHappy, task, 200, Part.IMAGE);
        upload(pdHappy, task, 403, Part.IMAGE, Part.TEXT);
        upload(pdHappy, task, 403, Part.VIDEO);
    }

    @Test
    void marvelWritesVideoOnAnyProjectButNotTextOrImages() throws Exception {
        Task happy = newTask("happy");
        Task creative = newTask("creative");

        upload(marvel, happy, 200, Part.VIDEO);
        upload(marvel, creative, 200, Part.VIDEO);
        upload(marvel, happy, 403, Part.TEXT);
        upload(marvel, happy, 403, Part.IMAGE);
    }

    @Test
    void adminWritesEveryZone() throws Exception {
        Task task = newTask("creative");

        upload(admin, task, 200, Part.TEXT, Part.IMAGE, Part.VIDEO);
    }

    @Test
    void importFromAsinIsAdminOnly() throws Exception {
        Task task = newTask("happy");

        for (String token : new String[] {sellerHappy, pdHappy, marvel}) {
            mockMvc.perform(post("/api/previews/import")
                            .header("Authorization", bearer(token))
                            .param("taskId", task.getId().toString())
                            .param("platform", "AMAZON")
                            .param("asin", "B000TESTASIN"))
                    .andExpect(status().isForbidden());
        }
    }

    // ---------- project: task của project khác trả 404 ----------

    @Test
    void uploadToTaskOfAnotherProjectIsNotFound() throws Exception {
        Task happy = newTask("happy");

        upload(sellerCreative, happy, 404, Part.TEXT);
        upload(pdCreative, happy, 404, Part.IMAGE);
        // 404, không lộ sự tồn tại của task bằng 403 của vùng
        upload(sellerCreative, happy, 404, Part.IMAGE);
        upload(admin, taskWithRandomId(), 404, Part.TEXT);
    }

    @Test
    void previewIsReadableOnlyInsideItsProject() throws Exception {
        Task task = newTask("happy");
        String previewId = upload(sellerHappy, task, 200, Part.TEXT);

        for (String token : new String[] {sellerHappy, pdHappy, marvel, admin}) {
            getPreview(token, previewId, 200);
        }
        getPreview(sellerCreative, previewId, 404);
        getPreview(pdCreative, previewId, 404);
        getPreview(sellerHappy, UUID.randomUUID().toString(), 404);
    }

    @Test
    void commentsAreReadableAndWritableOnlyInsideTheProject() throws Exception {
        Task task = newTask("happy");
        String previewId = upload(sellerHappy, task, 200, Part.TEXT);

        for (String token : new String[] {sellerHappy, pdHappy, marvel, admin}) {
            mockMvc.perform(get("/api/previews/{id}/comments", previewId).header("Authorization", bearer(token)))
                    .andExpect(status().isOk());
        }
        mockMvc.perform(get("/api/previews/{id}/comments", previewId).header("Authorization", bearer(sellerCreative)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/previews/{id}/comments", previewId).header("Authorization", bearer(pdCreative)))
                .andExpect(status().isNotFound());

        postComment(sellerCreative, previewId, 404);
        postComment(pdCreative, previewId, 404);
        String commentId = postComment(pdHappy, previewId, 200);
        postComment(marvel, previewId, 200);

        mockMvc.perform(put("/api/comments/{id}/resolve", commentId).header("Authorization", bearer(sellerCreative)))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/comments/{id}/resolve", UUID.randomUUID()).header("Authorization", bearer(sellerHappy)))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/comments/{id}/resolve", commentId).header("Authorization", bearer(sellerHappy)))
                .andExpect(status().isOk());
    }

    @Test
    void requestsWithoutTokenAreUnauthorized() throws Exception {
        mockMvc.perform(get("/api/previews/{id}", UUID.randomUUID())).andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/tasks/{id}", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"APPROVED\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(multipart("/api/previews/upload")).andExpect(status().isUnauthorized());
    }

    // ---------- helpers ----------

    private String tokenOf(Role role, String projectKey) {
        String name = role.name().toLowerCase() + "." + (projectKey == null ? "all" : projectKey);
        User user = new User();
        user.setEmail(name + "@test.local");
        user.setUsername(name);
        user.setFullName(role.name());
        user.setRole(role);
        user.setProjectKey(projectKey);
        User saved = userRepository.save(user);
        CustomUserDetails details = new CustomUserDetails(saved);
        return jwtTokenProvider.generateToken(
                new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities()));
    }

    private Task newTask(String projectKey) {
        Task task = new Task();
        task.setProject(projectRepository.findByKey(projectKey).orElseThrow());
        task.setCreatedBy(userRepository.findAll().getFirst());
        task.setTitle("Task of " + projectKey);
        task.setPlatform(Platform.AMAZON);
        task.setStatus(TaskStatus.PENDING_UPLOADS);
        return taskRepository.save(task);
    }

    private Task taskWithRandomId() {
        Task task = new Task();
        task.setId(UUID.randomUUID());
        return task;
    }

    private Task reload(Task task) {
        return taskRepository.findById(task.getId()).orElseThrow();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private void updateStatus(String token, Task task, String status, int expected) throws Exception {
        mockMvc.perform(put("/api/tasks/{id}", task.getId())
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"" + status + "\"}"))
                .andExpect(status().is(expected));
    }

    private enum Part { TEXT, IMAGE, VIDEO }

    /** Gửi multipart upload với các phần chỉ định; trả về id preview khi thành công. */
    private String upload(String token, Task task, int expected, Part... parts) throws Exception {
        MockMultipartHttpServletRequestBuilder request = MockMvcRequestBuilders.multipart("/api/previews/upload")
                .header("Authorization", bearer(token))
                .param("taskId", task.getId().toString())
                .param("platform", "AMAZON")
                .param("title", "Title sent by client");
        for (Part part : parts) {
            switch (part) {
                case TEXT -> request.param("price", "19.99").param("brand", "Brand").param("bulletPoints", "Bullet");
                case IMAGE -> request.file(new MockMultipartFile(
                        "mainImage", "p.jpg", "image/jpeg", "img".getBytes(StandardCharsets.UTF_8)));
                case VIDEO -> request.file(new MockMultipartFile(
                        "videos", "v.mp4", "video/mp4", "vid".getBytes(StandardCharsets.UTF_8)));
            }
        }
        String body = mockMvc.perform(request).andExpect(status().is(expected)).andReturn()
                .getResponse().getContentAsString();
        return expected == 200 ? objectMapper.readTree(body).get("id").asText() : null;
    }

    private void getPreview(String token, String previewId, int expected) throws Exception {
        mockMvc.perform(get("/api/previews/{id}", previewId).header("Authorization", bearer(token)))
                .andExpect(status().is(expected));
    }

    private String postComment(String token, String previewId, int expected) throws Exception {
        String body = mockMvc.perform(post("/api/previews/{id}/comments", previewId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Cần sửa title\",\"targetComponent\":\"TEXT\"}"))
                .andExpect(status().is(expected)).andReturn().getResponse().getContentAsString();
        return expected == 200 ? objectMapper.readTree(body).get("id").asText() : null;
    }
}
