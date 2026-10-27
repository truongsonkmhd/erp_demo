package com.xxxx.ddd.domain.respository.work;

import com.xxxx.ddd.domain.model.entity.work.ProjectTaskFollower;
import java.util.Collection;
import java.util.List;

/** Người phối hợp của việc. */
public interface ProjectTaskFollowerRepository {
    List<ProjectTaskFollower> findByTaskId(Long taskId);
    /** Các bản ghi mà người dùng đang phối hợp (lọc "Tôi phối hợp"). */
    List<Long> findTaskIdsByUserId(Long userId);
    /** Thay toàn bộ người phối hợp của việc bằng danh sách mới. */
    void replaceFollowers(Long taskId, Collection<Long> userIds);
}
