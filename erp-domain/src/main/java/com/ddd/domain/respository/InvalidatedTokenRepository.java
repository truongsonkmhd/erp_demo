package com.xxxx.ddd.domain.respository;

import com.xxxx.ddd.domain.model.entity.InvalidatedToken;

import java.util.Optional;

public interface InvalidatedTokenRepository {
    InvalidatedToken save(InvalidatedToken token);

    Optional<InvalidatedToken> findById(String jti);

    boolean existsById(String jti);
}
