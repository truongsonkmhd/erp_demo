package com.xxxx.ddd.domain.respository.work;

import com.xxxx.ddd.domain.model.entity.work.ProjectTask;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

/** Việc trong dự án (bỏ qua bản ghi đã xoá mềm ở các hàm tìm). */
public interface ProjectTaskRepository {
    Optional<ProjectTask> findByCode(String code);
    /** By id, deleted rows included (a task points to its project / parent by id). */
    Optional<ProjectTask> findById(Long id);
    boolean existsByCode(String code);
    ProjectTask save(ProjectTask task);
    Page<ProjectTask> search(Specification<ProjectTask> spec, Pageable pageable);
    List<ProjectTask> findByProjectId(Long projectId);
    /** Số việc chưa xoá của dự án (dự án chỉ xoá được khi bằng 0). */
    long countLiveByProjectId(Long projectId);
}
