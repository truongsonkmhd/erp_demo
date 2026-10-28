package com.xxxx.ddd.infrastructure.persistence.repository.work;

import java.util.List;
import com.xxxx.ddd.domain.model.entity.work.ProjectDeleteRequest;
import com.xxxx.ddd.domain.model.enums.work.DeleteRequestStatus;
import com.xxxx.ddd.domain.respository.work.ProjectDeleteRequestRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.work.ProjectDeleteRequestJPAMapper;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class ProjectDeleteRequestRepositoryImpl implements ProjectDeleteRequestRepository {
    private final ProjectDeleteRequestJPAMapper mapper;

    public ProjectDeleteRequestRepositoryImpl(ProjectDeleteRequestJPAMapper mapper) {
        this.mapper = mapper;
    }

    public Optional<ProjectDeleteRequest> findPending(Long projectId) { return mapper.findFirstByProjectIdAndStatusOrderByIdDesc(projectId, DeleteRequestStatus.PENDING); }
    public Optional<ProjectDeleteRequest> findLatest(Long projectId) { return mapper.findFirstByProjectIdOrderByIdDesc(projectId); }
    public ProjectDeleteRequest save(ProjectDeleteRequest request) { return mapper.save(request); }
    public List<ProjectDeleteRequest> findAllPending() { return mapper.findByStatus(DeleteRequestStatus.PENDING); }
}
