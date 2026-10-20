package com.xxxx.ddd.application.service.auth;

import com.xxxx.ddd.domain.model.entity.Token;
import com.xxxx.ddd.domain.model.entity.User;

import java.util.Optional;

public interface JwtService {
    String generateAccessToken(User user, boolean rememberMe);

    String generateRefreshToken(User user, boolean rememberMe);

    String extractUsername(String token);

    String extractJti(String token);

    boolean isValid(String token);

    void persistTokens(User user, String accessToken, String refreshToken, boolean rememberMe);

    Optional<Token> findByRefreshToken(String refreshToken);

    void invalidateAccessToken(String token);

    boolean isInvalidated(String jti);
}
