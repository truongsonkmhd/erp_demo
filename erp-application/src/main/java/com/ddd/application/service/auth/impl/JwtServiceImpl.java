package com.xxxx.ddd.application.service.auth.impl;

import com.xxxx.ddd.application.service.auth.JwtService;
import com.xxxx.ddd.domain.model.entity.InvalidatedToken;
import com.xxxx.ddd.domain.model.entity.Token;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.respository.InvalidatedTokenRepository;
import com.xxxx.ddd.domain.respository.TokenRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.Optional;
import java.util.StringJoiner;
import java.util.UUID;

@Service
@Slf4j
public class JwtServiceImpl implements JwtService {

    public static final String CLAIM_USER_ID = "userID";
    public static final String CLAIM_USER_NAME = "userName";
    public static final String CLAIM_ROLE = "role";
    public static final String CLAIM_LEVEL_ID = "levelId";
    public static final String CLAIM_SCOPE = "scope";

    @Value("${security.jwt.base64-secret}")
    private String secretKey;

    @Value("${security.jwt.token-validity-in-seconds}")
    private long jwtExpiration;

    @Value("${security.jwt.token-validity-in-seconds-for-remember-me}")
    private long jwtExpirationRememberMe;

    @Value("${security.jwt.refresh-token-validity-in-seconds}")
    private long refreshExpiration;

    @Value("${security.jwt.refresh-token-validity-in-seconds-for-remember-me}")
    private long refreshExpirationRememberMe;

    private final TokenRepository tokenRepository;
    private final InvalidatedTokenRepository invalidatedTokenRepository;

    public JwtServiceImpl(TokenRepository tokenRepository, InvalidatedTokenRepository invalidatedTokenRepository) {
        this.tokenRepository = tokenRepository;
        this.invalidatedTokenRepository = invalidatedTokenRepository;
    }

    @Override
    public String generateAccessToken(User user, boolean rememberMe) {
        return buildToken(user, true, rememberMe ? jwtExpirationRememberMe : jwtExpiration);
    }

    @Override
    public String generateRefreshToken(User user, boolean rememberMe) {
        return buildToken(user, false, rememberMe ? refreshExpirationRememberMe : refreshExpiration);
    }

    @Override
    public String extractUsername(String token) {
        Claims claims = parseClaims(token);
        String username = claims.get(CLAIM_USER_NAME, String.class);
        return username != null ? username : claims.getSubject();
    }

    @Override
    public String extractJti(String token) {
        return parseClaims(token).getId();
    }

    @Override
    public boolean isValid(String token) {
        try {
            Claims claims = parseClaims(token);
            if (claims.getExpiration().before(new Date())) {
                return false;
            }
            String jti = claims.getId();
            return jti == null || !invalidatedTokenRepository.existsById(jti);
        } catch (Exception e) {
            log.debug("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public void persistTokens(User user, String accessToken, String refreshToken, boolean rememberMe) {
        long ttl = rememberMe ? refreshExpirationRememberMe : refreshExpiration;
        LocalDateTime expiration = LocalDateTime.ofInstant(
                Instant.now().plusSeconds(ttl), ZoneId.systemDefault());
        Token token = tokenRepository.findByUserId(user.getId()).orElseGet(Token::new);
        token.setUser(user);
        token.setAccessToken(accessToken);
        token.setRefreshToken(refreshToken);
        token.setExpirationTime(expiration);
        tokenRepository.save(token);
    }

    @Override
    public Optional<Token> findByRefreshToken(String refreshToken) {
        return tokenRepository.findByRefreshToken(refreshToken);
    }

    @Override
    public void invalidateAccessToken(String token) {
        Claims claims = parseClaims(token);
        String jti = claims.getId();
        if (jti == null || jti.isBlank()) {
            throw new IllegalArgumentException("Token cannot be invalidated");
        }
        InvalidatedToken invalidated = new InvalidatedToken()
                .setId(jti)
                .setExpiryTime(LocalDateTime.ofInstant(claims.getExpiration().toInstant(), ZoneId.systemDefault()));
        invalidatedTokenRepository.save(invalidated);
        Object userId = claims.get(CLAIM_USER_ID);
        if (userId instanceof Number number) {
            tokenRepository.deleteByUserId(number.longValue());
        }
    }

    @Override
    public boolean isInvalidated(String jti) {
        return jti != null && invalidatedTokenRepository.existsById(jti);
    }

    private String buildToken(User user, boolean includeScope, long ttlSeconds) {
        Instant now = Instant.now();
        // Roles only: permission codes are loaded from the DB on every request (JwtAuthenticationFilter), and
        // putting them here made admin tokens exceed the 8 KB request-header limit of Tomcat and nginx.
        StringJoiner scope = new StringJoiner(" ");
        if (includeScope) {
            // Roles only: permissions, position and unit change often and are reloaded from the database on every
            // request (JwtAuthenticationFilter), so a revoked permission takes effect without waiting for the token.
            user.getRoles().forEach(role -> scope.add("ROLE_" + role.getCode().trim().toUpperCase()));
        }
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.getUsername())
                .claim(CLAIM_USER_ID, user.getId())
                .claim(CLAIM_USER_NAME, user.getUsername())
                .claim(CLAIM_ROLE, user.getRoleCode())
                .claim(CLAIM_LEVEL_ID, user.getLevelCode())
                .claim(CLAIM_SCOPE, scope.toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ttlSeconds)))
                .signWith(signingKey())
                .compact();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey signingKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
