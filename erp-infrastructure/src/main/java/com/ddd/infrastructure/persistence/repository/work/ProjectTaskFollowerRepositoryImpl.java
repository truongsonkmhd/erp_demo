package com.xxxx.ddd.infrastructure.persistence.repository.work;

import com.xxxx.ddd.domain.model.entity.work.ProjectTaskFollower;
import com.xxxx.ddd.domain.respository.work.ProjectTaskFollowerRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.work.ProjectTaskFollowerJPAMapper;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class ProjectTaskFollowerRepositoryImpl implements ProjectTaskFollowerRepository {
    private final ProjectTaskFollowerJPAMapper mapper;

    public ProjectTaskFollowerRepositoryImpl(ProjectTaskFollowerJPAMapper mapper) {
        this.mapper = mapper;
    }

    public List<ProjectTaskFollower> findByTaskId(Long taskId) { return mapper.findByTaskId(taskId); }
    public List<Long> findTaskIdsByUserId(Long userId) { return mapper.findTaskIdsByUserId(userId); }
    public void replaceFollowers(Long taskId, Collection<Long> userIds) {
        mapper.deleteByTaskId(taskId);
        LocalDateTime now = LocalDateTime.now();
        mapper.saveAll(new LinkedHashSet<>(userIds).stream()
                .map(id -> new ProjectTaskFollower().setTaskId(taskId).setUserId(id).setCreatedAt(now)).toList());
    }
}
