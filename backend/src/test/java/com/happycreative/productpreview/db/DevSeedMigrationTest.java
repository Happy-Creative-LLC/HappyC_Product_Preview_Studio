package com.happycreative.productpreview.db;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Profile dev nạp thêm db/seed-dev. Mật khẩu seed đến từ DEV_SEED_PASSWORD (ở đây là giá trị tổng hợp
 * của test), không nằm trong code hay SQL. Cần Docker.
 */
@SpringBootTest(properties = {
        "jwt.secret=test-only-jwt-secret-not-for-real-use-0123456789-abcdefghijklmnopqrstuvwxyz",
        "DEV_SEED_PASSWORD=Dev-Seed-Pass-For-Test-1"
})
@ActiveProfiles("dev")
@AutoConfigureMockMvc
@Testcontainers
class DevSeedMigrationTest {

    private static final String SEED_PASSWORD = "Dev-Seed-Pass-For-Test-1";

    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:15-alpine");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void seedsOneUserPerRoleAndProjectOnTopOfTheProjectSeed() {
        assertEquals(4L, jdbc.queryForObject("SELECT count(*) FROM projects", Long.class));

        List<Map<String, Object>> users = jdbc.queryForList(
                "SELECT username, role, project_key, auth_provider, status FROM users ORDER BY username");
        assertEquals(10, users.size());
        assertEquals(1L, users.stream().filter(u -> "ADMIN".equals(u.get("role"))).count());
        assertEquals(1L, users.stream().filter(u -> "MARVEL".equals(u.get("role"))).count());
        assertEquals(4L, users.stream().filter(u -> "SELLER".equals(u.get("role"))).count());
        assertEquals(4L, users.stream().filter(u -> "PRODUCT_DESIGN".equals(u.get("role"))).count());
        assertTrue(users.stream().allMatch(u -> "ACTIVE".equals(u.get("status")) && "LOCAL".equals(u.get("auth_provider"))));
        // Admin và Marvel không gắn project, Seller và Product Design phải có
        assertTrue(users.stream()
                .filter(u -> "ADMIN".equals(u.get("role")) || "MARVEL".equals(u.get("role")))
                .allMatch(u -> u.get("project_key") == null));
        assertTrue(users.stream()
                .filter(u -> "SELLER".equals(u.get("role")) || "PRODUCT_DESIGN".equals(u.get("role")))
                .allMatch(u -> u.get("project_key") != null));
    }

    @Test
    void passwordsAreBcryptHashesOfTheEnvironmentVariable() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        List<String> hashes = jdbc.queryForList("SELECT password_hash FROM users", String.class);

        assertEquals(10, hashes.size());
        assertTrue(hashes.stream().allMatch(hash -> encoder.matches(SEED_PASSWORD, hash)));
        assertFalse(hashes.stream().anyMatch(hash -> encoder.matches("Happyc123@", hash)));
    }

    @Test
    void seededUserCanLogInWithTheSeedPassword() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"hc.admin\",\"password\":\"" + SEED_PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"hc.admin\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void seedFileContainsNoPasswordNorHash() throws Exception {
        String sql = new ClassPathResource("db/seed-dev/R__dev_seed_users.sql")
                .getContentAsString(StandardCharsets.UTF_8);

        assertTrue(sql.contains("${devSeedPasswordHash}"));
        assertFalse(sql.contains("$2a$"));
        assertFalse(sql.contains("$2b$"));
        assertFalse(sql.contains("Happyc123"));
    }
}
