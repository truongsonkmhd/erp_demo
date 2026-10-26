package com.xxxx.ddd.infrastructure.persistence.mapper;

import com.xxxx.ddd.domain.model.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PositionJPAMapper extends JpaRepository<Position, Long> {
    Optional<Position> findByCodeIgnoreCase(String code);
}
