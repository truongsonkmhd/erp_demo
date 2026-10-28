package com.xxxx.ddd.infrastructure.persistence.mapper.work;

import com.xxxx.ddd.domain.model.entity.work.ProjectTaskComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectTaskCommentJPAMapper extends JpaRepository<ProjectTaskComment, Long> {
    List<ProjectTaskComment> findByTaskIdAndIsDeletedFalseOrderByCreatedAtAsc(Long taskId);
}
