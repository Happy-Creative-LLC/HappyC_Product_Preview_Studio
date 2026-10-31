package com.happycreative.productpreview;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableScheduling
public class ProductpreviewApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProductpreviewApplication.class, args);
	}

	@Bean
	public ObjectMapper objectMapper() {
		// Handler 401/403 của security ghi ApiErrorResponse (có Instant) bằng bean này; thiếu
		// JavaTimeModule thì mọi response 401/403 từ filter chain lỗi serialize.
		return new ObjectMapper()
				.registerModule(new JavaTimeModule())
				.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
	}

}
