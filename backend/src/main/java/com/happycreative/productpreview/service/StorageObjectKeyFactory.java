package com.happycreative.productpreview.service;

import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.UUID;

final class StorageObjectKeyFactory {

    private StorageObjectKeyFactory() {
    }

    static String create(String keyPrefix, String originalFilename) {
        String extension = safeExtension(originalFilename);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        String datedKey = "%04d/%02d/%02d/%s%s".formatted(
                today.getYear(),
                today.getMonthValue(),
                today.getDayOfMonth(),
                UUID.randomUUID(),
                extension);
        String prefix = normalizePrefix(keyPrefix);
        return prefix.isEmpty() ? datedKey : prefix + "/" + datedKey;
    }

    private static String safeExtension(String originalFilename) {
        String extension = StringUtils.getFilenameExtension(originalFilename);
        if (extension == null || !extension.matches("[A-Za-z0-9]{1,10}")) {
            return "";
        }
        return "." + extension.toLowerCase(Locale.ROOT);
    }

    private static String normalizePrefix(String keyPrefix) {
        if (keyPrefix == null) {
            return "";
        }
        return keyPrefix.trim().replace('\\', '/').replaceAll("^/+|/+$", "");
    }
}
