package com.xxxx.ddd.infrastructure.persistence.mapper.work;

import com.xxxx.ddd.domain.model.entity.work.MissionActivity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MissionActivityJPAMapper extends JpaRepository<MissionActivity, Long> {
    List<MissionActivity> findByMissionIdOrderByCreatedAtAscIdAsc(Long missionId);
}
