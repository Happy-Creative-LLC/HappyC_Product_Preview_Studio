package com.happycreative.productpreview.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.happycreative.productpreview.entity.Platform;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.entity.TaskStatus;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.repository.PreviewRepository;
import com.happycreative.productpreview.repository.ProjectRepository;
import com.happycreative.productpreview.repository.TaskRepository;
import com.happycreative.productpreview.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

/**
 * Ghi đồng thời lên cùng một task qua HTTP thật, filter chain và PostgreSQL: lưu Text (Seller) và upload ảnh
 * (Product Design) không được làm mất vùng của nhau. Cần Docker.
 */
@SpringBootTest(properties = "jwt.secret=test-only-jwt-secret-not-for-real-use-0123456789-abcdefghijklmnopqrstuvwxyz")
@AutoConfigureMockMvc
@Testcontainers
class PreviewConcurrencyApiTest {

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
    @Autowired private PreviewRepository previewRepository;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private PlatformTransactionManager transactionManager;

    private static String seller;
    private static String designer;

    @BeforeEach
    void users() {
        if (seller != null) {
            return;
        }
        seller = tokenOf(Role.SELLER);
        designer = tokenOf(Role.PRODUCT_DESIGN);
    }

    @Test
    void concurrentTextSaveAndImageUploadNeverOverwriteEachOthersZone() throws Exception {
        Task task = newTask();
        int version = objectMapper.readTree(putText(seller, task, "{\"title\":\"Draft\",\"description\":\"Draft\"}"))
                .get("version").asInt();

        // Hai request cùng mang version đã tải: đúng một request thắng, request kia nhận 409 thay vì ghi đè.
        List<Integer> statuses = concurrently(
                () -> putTextStatus(seller, task, "{\"description\":\"Seller text\",\"version\":" + version + "}"),
                () -> uploadStatus(designer, task, version));
        assertEquals(List.of(200, 409), statuses.stream().sorted().toList());

        // Client tải lại phiên bản hiện hành rồi gửi lại phần của mình.
        int fresh = currentVersion(task);
        if (statuses.get(0) == 409) {
            assertEquals(200, putTextStatus(seller, task, "{\"description\":\"Seller text\",\"version\":" + fresh + "}"));
        } else {
            assertEquals(200, uploadStatus(designer, task, fresh));
        }

        JsonNode data = productData(task);
        assertEquals("Seller text", data.get("description").asText());
        assertEquals(1, data.get("images").size());
        assertEquals(1L, previewCount(task));
    }

    @Test
    void concurrentFirstWritesCreateASinglePreview() throws Exception {
        Task task = newTask();

        List<Integer> statuses = concurrently(
                () -> putTextStatus(seller, task, "{\"title\":\"First\",\"description\":\"Seller text\"}"),
                () -> uploadStatus(designer, task, null));
        assertEquals(List.of(200, 409), statuses.stream().sorted().toList());
        assertEquals(1L, previewCount(task));

        int fresh = currentVersion(task);
        if (statuses.get(0) == 409) {
            assertEquals(200, putTextStatus(seller, task,
                    "{\"title\":\"First\",\"description\":\"Seller text\",\"version\":" + fresh + "}"));
        } else {
            assertEquals(200, uploadStatus(designer, task, fresh));
        }
        JsonNode data = productData(task);
        assertEquals("Seller text", data.get("description").asText());
        assertEquals(1, data.get("images").size());
        assertEquals(1L, previewCount(task));
    }

    @Test
    void staleVersionIsRejectedWithVietnameseMessage() throws Exception {
        Task task = newTask();
        putText(seller, task, "{\"title\":\"Draft\"}");

        String body = mockMvc.perform(put("/api/tasks/{id}/content/text", task.getId())
                        .header("Authorization", bearer(seller))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Stale\",\"version\":0}"))
                .andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("\"status\":409"));
        assertTrue(body.contains("tải lại nội dung hiện hành"));
        assertEquals(409, uploadStatus(designer, task, 0));
        assertEquals(409, uploadStatus(designer, task, null));
        assertEquals("Draft", productData(task).get("title").asText());
    }

    @Test
    void writersOfTheSameTaskRunOneAtATime() throws Exception {
        Task task = newTask();
        CountDownLatch holding = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<?> holder = pool.submit(() -> new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                taskRepository.findByIdForUpdate(task.getId());
                holding.countDown();
                awaitQuietly(release);
            }));
            assertTrue(holding.await(10, TimeUnit.SECONDS));

            Future<Integer> writer = pool.submit(() -> putTextStatus(seller, task, "{\"title\":\"Waits for the lock\"}"));
            // Hàng task đang bị giữ nên request ghi phải chờ, không được hoàn tất.
            assertThrows(TimeoutException.class, () -> writer.get(1500, TimeUnit.MILLISECONDS));

            release.countDown();
            assertEquals(200, writer.get(15, TimeUnit.SECONDS));
            holder.get(5, TimeUnit.SECONDS);
        } finally {
            release.countDown();
            pool.shutdownNow();
        }
    }

    @Test
    void hibernateRejectsAWriteBasedOnAStaleRow() throws Exception {
        Task task = newTask();
        putText(seller, task, "{\"title\":\"Draft\"}");
        UUID previewId = jdbc.queryForObject("SELECT id FROM previews WHERE task_id = ?", UUID.class, task.getId());
        TransactionTemplate outer = new TransactionTemplate(transactionManager);
        TransactionTemplate inner = new TransactionTemplate(transactionManager);
        inner.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        assertThrows(ObjectOptimisticLockingFailureException.class, () -> outer.executeWithoutResult(status -> {
            var stale = previewRepository.findById(previewId).orElseThrow();
            inner.executeWithoutResult(other -> {
                var winner = previewRepository.findById(previewId).orElseThrow();
                winner.setProductData("{\"title\":\"Winner\"}");
                previewRepository.saveAndFlush(winner);
            });
            stale.setProductData("{\"title\":\"Stale\"}");
            previewRepository.saveAndFlush(stale);
        }));

        assertEquals("Winner", productData(task).get("title").asText());
        assertEquals(1L, jdbc.queryForObject("SELECT lock_version FROM previews WHERE id = ?", Long.class, previewId));
    }

    // ---------- helpers ----------

    private String tokenOf(Role role) {
        User user = new User();
        user.setEmail("concurrency." + role.name().toLowerCase() + "@test.local");
        user.setUsername("concurrency." + role.name().toLowerCase());
        user.setFullName(role.name());
        user.setRole(role);
        user.setProjectKey("happy");
        User saved = userRepository.save(user);
        CustomUserDetails details = new CustomUserDetails(saved);
        return jwtTokenProvider.generateToken(
                new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities()));
    }

    private Task newTask() {
        Task task = new Task();
        task.setProject(projectRepository.findByKey("happy").orElseThrow());
        task.setCreatedBy(userRepository.findAll().getFirst());
        task.setTitle("Concurrent task");
        task.setPlatform(Platform.AMAZON);
        task.setStatus(TaskStatus.PENDING_UPLOADS);
        return taskRepository.save(task);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private String putText(String token, Task task, String json) throws Exception {
        var response = mockMvc.perform(put("/api/tasks/{id}/content/text", task.getId())
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andReturn().getResponse();
        assertEquals(200, response.getStatus());
        return response.getContentAsString();
    }

    private int putTextStatus(String token, Task task, String json) throws Exception {
        return mockMvc.perform(put("/api/tasks/{id}/content/text", task.getId())
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andReturn().getResponse().getStatus();
    }

    private int uploadStatus(String token, Task task, Integer version) throws Exception {
        MockMultipartHttpServletRequestBuilder request = MockMvcRequestBuilders.multipart("/api/previews/upload")
                .file(new MockMultipartFile("mainImage", "p.jpg", "image/jpeg", "img".getBytes(StandardCharsets.UTF_8)))
                .header("Authorization", bearer(token))
                .param("taskId", task.getId().toString())
                .param("platform", "AMAZON")
                .param("title", task.getTitle());
        if (version != null) {
            request.param("version", version.toString());
        }
        return mockMvc.perform(request).andReturn().getResponse().getStatus();
    }

    private int currentVersion(Task task) throws Exception {
        String body = mockMvc.perform(get("/api/tasks/{id}/preview", task.getId())
                        .header("Authorization", bearer(seller)))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("version").asInt();
    }

    private JsonNode productData(Task task) throws Exception {
        return objectMapper.readTree(jdbc.queryForObject(
                "SELECT product_data::text FROM previews WHERE task_id = ?", String.class, task.getId()));
    }

    private long previewCount(Task task) {
        return jdbc.queryForObject("SELECT count(*) FROM previews WHERE task_id = ?", Long.class, task.getId());
    }

    /** Chạy hai việc cùng lúc (chờ nhau ở barrier); trả mã trạng thái theo đúng thứ tự truyền vào. */
    private List<Integer> concurrently(Callable<Integer> first, Callable<Integer> second) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CyclicBarrier barrier = new CyclicBarrier(2);
        try {
            Future<Integer> a = pool.submit(() -> {
                barrier.await(10, TimeUnit.SECONDS);
                return first.call();
            });
            Future<Integer> b = pool.submit(() -> {
                barrier.await(10, TimeUnit.SECONDS);
                return second.call();
            });
            return List.of(a.get(30, TimeUnit.SECONDS), b.get(30, TimeUnit.SECONDS));
        } finally {
            pool.shutdownNow();
        }
    }

    private static void awaitQuietly(CountDownLatch latch) {
        try {
            latch.await(30, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
