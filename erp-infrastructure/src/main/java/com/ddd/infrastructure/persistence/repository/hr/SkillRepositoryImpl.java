package com.xxxx.ddd.infrastructure.persistence.repository.hr;

import com.xxxx.ddd.domain.model.entity.hr.Skill;
import com.xxxx.ddd.domain.respository.hr.SkillRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.hr.SkillJPAMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class SkillRepositoryImpl implements SkillRepository {
    private final SkillJPAMapper mapper;

    public SkillRepositoryImpl(SkillJPAMapper mapper) { this.mapper = mapper; }

    public List<Skill> findActive() { return mapper.findByActiveTrueOrderBySortOrderAscCodeAsc(); }
}
