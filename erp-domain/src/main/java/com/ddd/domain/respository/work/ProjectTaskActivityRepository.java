package com.xxxx.ddd.domain.respository.work;

import com.xxxx.ddd.domain.model.entity.work.ProjectTaskActivity;
import java.util.List;

/** Nhật ký thao tác của việc (chỉ ghi thêm). */
public interface ProjectTaskActivityRepository {
    /** Nhật ký, cũ trước. */
    List<ProjectTaskActivity> findByTaskId(Long taskId);
    ProjectTaskActivity save(ProjectTaskActivity activity);
}
