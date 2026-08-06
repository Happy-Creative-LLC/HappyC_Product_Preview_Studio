package com.happycreative.productpreview.controller;

import com.happycreative.productpreview.dto.AuthRequest;
import com.happycreative.productpreview.dto.AuthResponse;
import com.happycreative.productpreview.dto.GoogleAuthRequest;
import com.happycreative.productpreview.security.CustomUserDetails;
import com.happycreative.productpreview.security.JwtTokenProvider;
import com.happycreative.productpreview.service.GoogleAuthService;
import com.happycreative.productpreview.service.UserLoginService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@SuppressWarnings("unused")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleAuthService googleAuthService;
    private final UserLoginService userLoginService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtTokenProvider.generateToken(authentication);

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            userLoginService.recordLogin(userDetails.getUserId());

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

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> authenticateWithGoogle(
            @Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(googleAuthService.authenticate(request.getCredential()));
    }
}
