package com.xxxx.ddd.domain.respository.work;

import com.xxxx.ddd.domain.model.entity.work.ProjectTaskComment;
import java.util.List;

/** Ghi chú của việc. */
public interface ProjectTaskCommentRepository {
    /** Ghi chú chưa xoá, cũ trước. */
    List<ProjectTaskComment> findByTaskId(Long taskId);
    ProjectTaskComment save(ProjectTaskComment comment);
}
