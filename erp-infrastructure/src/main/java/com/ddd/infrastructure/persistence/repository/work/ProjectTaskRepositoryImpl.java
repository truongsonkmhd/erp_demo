package com.xxxx.ddd.infrastructure.persistence.repository.work;

import com.xxxx.ddd.domain.model.enums.work.TaskStatus;
import com.xxxx.ddd.domain.model.entity.work.ProjectTask;
import com.xxxx.ddd.domain.respository.work.ProjectTaskRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.work.ProjectTaskJPAMapper;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;

@Repository
public class ProjectTaskRepositoryImpl implements ProjectTaskRepository {
    private final ProjectTaskJPAMapper mapper;

    public ProjectTaskRepositoryImpl(ProjectTaskJPAMapper mapper) {
        this.mapper = mapper;
    }

    public Optional<ProjectTask> findById(Long id) { return mapper.findById(id); }
    public Optional<ProjectTask> findByCode(String code) { return mapper.findByCodeAndIsDeletedFalse(code); }
    public boolean existsByCode(String code) { return mapper.existsByCode(code); }
    public ProjectTask save(ProjectTask task) { return mapper.save(task); }
    public Page<ProjectTask> search(Specification<ProjectTask> spec, Pageable pageable) { return mapper.findAll(spec, pageable); }
    public List<ProjectTask> findByProjectId(Long projectId) { return mapper.findByProjectIdAndIsDeletedFalse(projectId); }
    public long countLiveByProjectId(Long projectId) { return mapper.countByProjectIdAndIsDeletedFalse(projectId); }
    public List<ProjectTask> findOpen() { return mapper.findByIsDeletedFalseAndStatusNot(TaskStatus.DONE); }
}
