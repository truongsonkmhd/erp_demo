package com.xxxx.ddd.infrastructure.persistence.mapper.work;

import com.xxxx.ddd.domain.model.enums.work.TaskStatus;
import com.xxxx.ddd.domain.model.entity.work.ProjectTask;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ProjectTaskJPAMapper extends JpaRepository<ProjectTask, Long>, JpaSpecificationExecutor<ProjectTask> {
    Optional<ProjectTask> findByCodeAndIsDeletedFalse(String code);
    boolean existsByCode(String code);
    List<ProjectTask> findByProjectIdAndIsDeletedFalse(Long projectId);
    long countByProjectIdAndIsDeletedFalse(Long projectId);
    List<ProjectTask> findByIsDeletedFalseAndStatusNot(TaskStatus status);
}
