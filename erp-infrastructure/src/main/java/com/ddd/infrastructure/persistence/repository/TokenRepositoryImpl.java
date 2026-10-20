package com.xxxx.ddd.infrastructure.persistence.repository;

import com.xxxx.ddd.domain.model.entity.Token;
import com.xxxx.ddd.domain.respository.TokenRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.TokenJPAMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class TokenRepositoryImpl implements TokenRepository {

    @Autowired
    private TokenJPAMapper tokenJPAMapper;

    @Override
    public Token save(Token token) {
        return tokenJPAMapper.save(token);
    }

    @Override
    public Optional<Token> findByUserId(Long userId) {
        return tokenJPAMapper.findByUserId(userId);
    }

    @Override
    public Optional<Token> findByRefreshToken(String refreshToken) {
        return tokenJPAMapper.findByRefreshToken(refreshToken);
    }

    @Override
    @Transactional
    public void deleteByUserId(Long userId) {
        tokenJPAMapper.deleteByUserId(userId);
    }
}
