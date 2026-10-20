package com.xxxx.ddd.infrastructure.persistence.repository;

import com.xxxx.ddd.domain.model.entity.InvalidatedToken;
import com.xxxx.ddd.domain.respository.InvalidatedTokenRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.InvalidatedTokenJPAMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class InvalidatedTokenRepositoryImpl implements InvalidatedTokenRepository {

    @Autowired
    private InvalidatedTokenJPAMapper invalidatedTokenJPAMapper;

    @Override
    public InvalidatedToken save(InvalidatedToken token) {
        return invalidatedTokenJPAMapper.save(token);
    }

    @Override
    public Optional<InvalidatedToken> findById(String jti) {
        return invalidatedTokenJPAMapper.findById(jti);
    }

    @Override
    public boolean existsById(String jti) {
        return invalidatedTokenJPAMapper.existsById(jti);
    }
}
