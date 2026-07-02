package com.happycreative.productpreview.controller;

import com.happycreative.productpreview.dto.AuthRequest;
import com.happycreative.productpreview.dto.AuthResponse;
import com.happycreative.productpreview.security.CustomUserDetails;
import com.happycreative.productpreview.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtTokenProvider.generateToken(authentication);

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

            return ResponseEntity.ok(new AuthResponse(
                    jwt,
                    userDetails.getUserId(),
                    userDetails.getEmail(),
                    userDetails.getFullName(),
                    userDetails.getRole(),
                    userDetails.getProjectKey()
            ));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Tên đăng nhập hoặc mật khẩu không đúng."));
        }
    }
}
