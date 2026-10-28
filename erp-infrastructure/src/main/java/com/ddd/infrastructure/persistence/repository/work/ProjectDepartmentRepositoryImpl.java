package com.xxxx.ddd.infrastructure.persistence.repository.work;

import com.xxxx.ddd.domain.model.entity.work.ProjectDepartment;
import com.xxxx.ddd.domain.respository.work.ProjectDepartmentRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.work.ProjectDepartmentJPAMapper;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class ProjectDepartmentRepositoryImpl implements ProjectDepartmentRepository {
    private final ProjectDepartmentJPAMapper mapper;

    public ProjectDepartmentRepositoryImpl(ProjectDepartmentJPAMapper mapper) {
        this.mapper = mapper;
    }

    public List<ProjectDepartment> findByProjectId(Long projectId) { return mapper.findByProjectId(projectId); }
    public List<Long> findProjectIdsByDepartmentId(Long departmentId) { return mapper.findProjectIdsByDepartmentId(departmentId); }
    public void replaceForProject(Long projectId, Collection<Long> departmentIds) {
        mapper.deleteByProjectId(projectId);
        LocalDateTime now = LocalDateTime.now();
        mapper.saveAll(new LinkedHashSet<>(departmentIds).stream()
                .map(id -> new ProjectDepartment().setProjectId(projectId).setDepartmentId(id).setCreatedAt(now)).toList());
    }
}
