package com.xxxx.ddd.infrastructure.persistence.mapper.work;

import com.xxxx.ddd.domain.model.entity.work.ProjectTaskActivity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectTaskActivityJPAMapper extends JpaRepository<ProjectTaskActivity, Long> {
    List<ProjectTaskActivity> findByTaskIdOrderByCreatedAtAscIdAsc(Long taskId);
}
