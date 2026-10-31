package com.happycreative.productpreview.db;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Chạy Flyway trên PostgreSQL 15 trống, với cấu hình thật của application.yml (không profile test):
 * context chỉ khởi động được khi Hibernate {@code validate} thấy entity khớp schema do migration tạo.
 * Cần Docker.
 */
@SpringBootTest(properties = "jwt.secret=test-only-jwt-secret-not-for-real-use-0123456789-abcdefghijklmnopqrstuvwxyz")
@Testcontainers
class PostgresMigrationTest {

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
    private Environment environment;

    @Test
    void usesFlywayWithHibernateValidateAndNoSqlLogging() {
        assertEquals("true", environment.getProperty("spring.flyway.enabled"));
        assertEquals("validate", environment.getProperty("spring.jpa.hibernate.ddl-auto"));
        assertEquals("false", environment.getProperty("spring.jpa.show-sql"));
    }

    @Test
    void v1RunsOnEmptyDatabaseThenV2() {
        List<Map<String, Object>> history = jdbc.queryForList(
                "SELECT version, type, success FROM flyway_schema_history ORDER BY installed_rank");

        assertEquals(List.of("1", "2"), history.stream().map(row -> (String) row.get("version")).toList());
        // V1 chạy thật (SQL), không phải baseline
        assertTrue(history.stream().allMatch(row -> "SQL".equals(row.get("type"))));
        assertTrue(history.stream().allMatch(row -> Boolean.TRUE.equals(row.get("success"))));
    }

    @Test
    void createsEveryTableOfTheEntityModel() {
        List<String> tables = jdbc.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' "
                        + "AND table_type = 'BASE TABLE' AND table_name <> 'flyway_schema_history' ORDER BY 1",
                String.class);

        assertEquals(
                List.of("comments", "previews", "projects", "search_cache", "stored_files", "tasks", "users"),
                tables);
    }

    @Test
    void seedsTheFourProjectsAndNoUsers() {
        List<String> projectKeys = jdbc.queryForList(
                "SELECT project_key FROM projects ORDER BY project_key", String.class);

        assertEquals(List.of("creative", "global", "hapify84", "happy"), projectKeys);
        assertEquals(0L, jdbc.queryForObject("SELECT count(*) FROM users", Long.class));
    }
}
