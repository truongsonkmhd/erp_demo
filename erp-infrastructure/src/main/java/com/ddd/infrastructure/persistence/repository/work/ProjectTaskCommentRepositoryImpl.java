package com.xxxx.ddd.infrastructure.persistence.repository.work;

import com.xxxx.ddd.domain.model.entity.work.ProjectTaskComment;
import com.xxxx.ddd.domain.respository.work.ProjectTaskCommentRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.work.ProjectTaskCommentJPAMapper;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class ProjectTaskCommentRepositoryImpl implements ProjectTaskCommentRepository {
    private final ProjectTaskCommentJPAMapper mapper;

    public ProjectTaskCommentRepositoryImpl(ProjectTaskCommentJPAMapper mapper) {
        this.mapper = mapper;
    }

    public List<ProjectTaskComment> findByTaskId(Long taskId) { return mapper.findByTaskIdAndIsDeletedFalseOrderByCreatedAtAsc(taskId); }
    public ProjectTaskComment save(ProjectTaskComment comment) { return mapper.save(comment); }
}
