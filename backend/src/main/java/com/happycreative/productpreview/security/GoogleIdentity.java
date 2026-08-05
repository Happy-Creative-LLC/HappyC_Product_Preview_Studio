package com.happycreative.productpreview.security;

public record GoogleIdentity(
        String subject,
        String email,
        String fullName,
        String avatarUrl) {
}
