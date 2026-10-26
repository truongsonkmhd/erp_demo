package com.xxxx.ddd.domain.respository;

import com.xxxx.ddd.domain.model.entity.Position;

import java.util.List;
import java.util.Optional;

public interface PositionRepository {
    List<Position> findAll();

    Optional<Position> findByCode(String code);
}
