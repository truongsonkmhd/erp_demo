package com.xxxx.ddd.domain.respository.work;

import com.xxxx.ddd.domain.model.entity.work.ProjectDepartment;
import java.util.Collection;
import java.util.List;

/** Đơn vị phối hợp của dự án. */
public interface ProjectDepartmentRepository {
    List<ProjectDepartment> findByProjectId(Long projectId);
    List<Long> findProjectIdsByDepartmentId(Long departmentId);
    /** Thay toàn bộ đơn vị phối hợp của dự án bằng danh sách mới. */
    void replaceForProject(Long projectId, Collection<Long> departmentIds);
}
