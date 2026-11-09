package com.happycreative.productpreview.db;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
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
import java.util.UUID;
import java.sql.DriverManager;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
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
    void v1RunsOnEmptyDatabaseThenV2AndV3() {
        List<Map<String, Object>> history = jdbc.queryForList(
                "SELECT version, type, success FROM flyway_schema_history ORDER BY installed_rank");

        assertEquals(List.of("1", "2", "3"), history.stream().map(row -> (String) row.get("version")).toList());
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
                List.of("comments", "previews", "projects", "search_cache", "stored_files", "task_events", "tasks", "users"),
                tables);
    }

    @Test
    void v3AddsSkuIndexAndTaskEventsWithoutChangingPreviewJsonb() {
        assertEquals("character varying", jdbc.queryForObject(
                "SELECT data_type FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'sku'",
                String.class));
        assertEquals(100, jdbc.queryForObject(
                "SELECT character_maximum_length FROM information_schema.columns "
                        + "WHERE table_name = 'tasks' AND column_name = 'sku'", Integer.class));
        assertEquals("jsonb", jdbc.queryForObject(
                "SELECT data_type FROM information_schema.columns "
                        + "WHERE table_name = 'previews' AND column_name = 'product_data'", String.class));
        assertEquals(1L, jdbc.queryForObject(
                "SELECT count(*) FROM pg_indexes WHERE tablename = 'tasks' "
                        + "AND indexname = 'idx_tasks_project_sku' "
                        + "AND indexdef LIKE '%(project_id, sku)%'", Long.class));
        assertEquals(6L, jdbc.queryForObject(
                "SELECT count(*) FROM information_schema.columns WHERE table_name = 'task_events' "
                        + "AND column_name IN ('id', 'task_id', 'event_type', 'actor_id', 'detail', 'created_at')", Long.class));
    }

    @Test
    void seedsTheFourProjectsAndNoUsers() {
        List<String> projectKeys = jdbc.queryForList(
                "SELECT project_key FROM projects ORDER BY project_key", String.class);

        assertEquals(List.of("creative", "global", "hapify84", "happy"), projectKeys);
        assertEquals(0L, jdbc.queryForObject("SELECT count(*) FROM users", Long.class));
    }

    @Test
    void v3UpgradesExistingV2TaskWithoutDeletingIt() throws Exception {
        String databaseName = "p1_upgrade_" + UUID.randomUUID().toString().substring(0, 8);
        jdbc.execute("CREATE DATABASE " + databaseName);
        String url = POSTGRES.getJdbcUrl().replace("/" + POSTGRES.getDatabaseName(), "/" + databaseName);
        Flyway.configure().dataSource(url, POSTGRES.getUsername(), POSTGRES.getPassword())
                .target(MigrationVersion.fromVersion("2")).load().migrate();
        UUID userId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        try (var connection = DriverManager.getConnection(url, POSTGRES.getUsername(), POSTGRES.getPassword())) {
            try (var user = connection.prepareStatement(
                    "INSERT INTO public.users(id, email, role, project_key) VALUES (?, ?, 'SELLER', 'happy')")) {
                user.setObject(1, userId);
                user.setString(2, "p1-v2-" + userId + "@test.local");
                user.executeUpdate();
            }
            try (var task = connection.prepareStatement(
                    "INSERT INTO public.tasks(id, project_id, created_by, title) "
                            + "VALUES (?, (SELECT id FROM public.projects WHERE project_key = 'happy'), ?, 'Existing V2')")) {
                task.setObject(1, taskId);
                task.setObject(2, userId);
                task.executeUpdate();
            }
        }
        Flyway.configure().dataSource(url, POSTGRES.getUsername(), POSTGRES.getPassword()).load().migrate();
        try (var connection = DriverManager.getConnection(url, POSTGRES.getUsername(), POSTGRES.getPassword());
             var check = connection.prepareStatement("SELECT title, sku FROM public.tasks WHERE id = ?")) {
            check.setObject(1, taskId);
            try (var row = check.executeQuery()) {
                assertTrue(row.next());
                assertEquals("Existing V2", row.getString("title"));
                assertNull(row.getString("sku"));
            }
        }
    }
}
