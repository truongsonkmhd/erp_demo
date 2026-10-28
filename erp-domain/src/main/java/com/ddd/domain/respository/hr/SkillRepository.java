package com.xxxx.ddd.domain.respository.hr;

import com.xxxx.ddd.domain.model.entity.hr.Skill;

import java.util.List;

public interface SkillRepository {
    /** Active skills in display order. */
    List<Skill> findActive();
}
