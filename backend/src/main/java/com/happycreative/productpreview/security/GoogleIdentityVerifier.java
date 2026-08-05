package com.happycreative.productpreview.security;

public interface GoogleIdentityVerifier {
    GoogleIdentity verify(String credential);
}
