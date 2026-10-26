package com.xxxx.ddd.infrastructure.persistence.repository;

import com.xxxx.ddd.domain.model.entity.Position;
import com.xxxx.ddd.domain.respository.PositionRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.PositionJPAMapper;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class PositionRepositoryImpl implements PositionRepository {
    private final PositionJPAMapper mapper;

    public PositionRepositoryImpl(PositionJPAMapper mapper) { this.mapper = mapper; }

    public List<Position> findAll() { return mapper.findAll(Sort.by("level", "id")); }
    public Optional<Position> findByCode(String code) { return mapper.findByCodeIgnoreCase(code); }
}
