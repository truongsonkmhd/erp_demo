package com.xxxx.ddd.domain.respository;

import com.xxxx.ddd.domain.model.entity.Token;

import java.util.Optional;

public interface TokenRepository {
    Token save(Token token);

    Optional<Token> findByUserId(Long userId);

    Optional<Token> findByRefreshToken(String refreshToken);

    void deleteByUserId(Long userId);
}
