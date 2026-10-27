package com.xxxx.ddd.infrastructure.persistence.mapper.work;

import com.xxxx.ddd.domain.model.entity.work.ProjectDeleteRequest;
import com.xxxx.ddd.domain.model.enums.work.DeleteRequestStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectDeleteRequestJPAMapper extends JpaRepository<ProjectDeleteRequest, Long> {
    Optional<ProjectDeleteRequest> findFirstByProjectIdAndStatusOrderByIdDesc(Long projectId, DeleteRequestStatus status);
    Optional<ProjectDeleteRequest> findFirstByProjectIdOrderByIdDesc(Long projectId);
}
