package com.xxxx.ddd.domain.respository.work;

import java.util.List;
import com.xxxx.ddd.domain.model.entity.work.ProjectDeleteRequest;
import java.util.Optional;

/** Đề nghị xoá dự án. */
public interface ProjectDeleteRequestRepository {
    /** Đề nghị đang chờ Liên đoàn trưởng quyết (mỗi dự án tối đa một). */
    Optional<ProjectDeleteRequest> findPending(Long projectId);
    /** Đề nghị gần nhất (để hiện lý do không xoá lần trước). */
    Optional<ProjectDeleteRequest> findLatest(Long projectId);
    ProjectDeleteRequest save(ProjectDeleteRequest request);
    /** Mọi đề nghị xoá đang chờ Liên đoàn trưởng quyết. */
    List<ProjectDeleteRequest> findAllPending();
}
