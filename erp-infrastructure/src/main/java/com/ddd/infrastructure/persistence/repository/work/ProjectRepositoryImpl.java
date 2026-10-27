package com.xxxx.ddd.infrastructure.persistence.repository.work;

import java.util.List;
import com.xxxx.ddd.domain.model.entity.work.Project;
import com.xxxx.ddd.domain.respository.work.ProjectRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.work.ProjectJPAMapper;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;

@Repository
public class ProjectRepositoryImpl implements ProjectRepository {
    private final ProjectJPAMapper mapper;

    public ProjectRepositoryImpl(ProjectJPAMapper mapper) {
        this.mapper = mapper;
    }

    public Optional<Project> findById(Long id) { return mapper.findById(id); }
    public Optional<Project> findByCode(String code) { return mapper.findByCodeAndIsDeletedFalse(code); }
    public boolean existsByCode(String code) { return mapper.existsByCode(code); }
    public Project save(Project project) { return mapper.save(project); }
    public Page<Project> search(Specification<Project> spec, Pageable pageable) { return mapper.findAll(spec, pageable); }
    public List<Project> findLive() { return mapper.findByIsDeletedFalse(); }
}
