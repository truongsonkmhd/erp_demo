package com.xxxx.ddd.infrastructure.persistence.mapper.hr;

import com.xxxx.ddd.domain.model.entity.hr.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SkillJPAMapper extends JpaRepository<Skill, String> {
    List<Skill> findByActiveTrueOrderBySortOrderAscCodeAsc();
}
