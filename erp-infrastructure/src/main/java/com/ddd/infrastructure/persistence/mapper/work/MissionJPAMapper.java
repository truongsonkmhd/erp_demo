package com.xxxx.ddd.infrastructure.persistence.mapper.work;

import com.xxxx.ddd.domain.model.entity.work.Mission;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface MissionJPAMapper extends JpaRepository<Mission, Long>, JpaSpecificationExecutor<Mission> {
    Optional<Mission> findByCodeAndIsDeletedFalse(String code);
    boolean existsByCode(String code);
}
