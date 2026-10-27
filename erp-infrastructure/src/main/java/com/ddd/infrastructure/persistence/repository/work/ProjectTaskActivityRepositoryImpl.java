package com.xxxx.ddd.infrastructure.persistence.repository.work;

import com.xxxx.ddd.domain.model.entity.work.ProjectTaskActivity;
import com.xxxx.ddd.domain.respository.work.ProjectTaskActivityRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.work.ProjectTaskActivityJPAMapper;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class ProjectTaskActivityRepositoryImpl implements ProjectTaskActivityRepository {
    private final ProjectTaskActivityJPAMapper mapper;

    public ProjectTaskActivityRepositoryImpl(ProjectTaskActivityJPAMapper mapper) {
        this.mapper = mapper;
    }

    public List<ProjectTaskActivity> findByTaskId(Long taskId) { return mapper.findByTaskIdOrderByCreatedAtAscIdAsc(taskId); }
    public ProjectTaskActivity save(ProjectTaskActivity activity) { return mapper.save(activity); }
}
