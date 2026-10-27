package com.xxxx.ddd.infrastructure.persistence.repository.work;

import com.xxxx.ddd.domain.model.entity.work.Mission;
import com.xxxx.ddd.domain.respository.work.MissionRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.work.MissionJPAMapper;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;

@Repository
public class MissionRepositoryImpl implements MissionRepository {
    private final MissionJPAMapper mapper;

    public MissionRepositoryImpl(MissionJPAMapper mapper) {
        this.mapper = mapper;
    }

    public Optional<Mission> findByCode(String code) { return mapper.findByCodeAndIsDeletedFalse(code); }
    public boolean existsByCode(String code) { return mapper.existsByCode(code); }
    public Mission save(Mission mission) { return mapper.save(mission); }
    public Page<Mission> search(Specification<Mission> spec, Pageable pageable) { return mapper.findAll(spec, pageable); }
}
