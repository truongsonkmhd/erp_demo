package com.xxxx.ddd.domain.respository.work;

import java.util.List;
import com.xxxx.ddd.domain.model.entity.work.Project;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

/** Dự án (bỏ qua bản ghi đã xoá mềm ở các hàm tìm). */
public interface ProjectRepository {
    Optional<Project> findByCode(String code);
    /** By id, deleted rows included (a task points to its project / parent by id). */
    Optional<Project> findById(Long id);
    boolean existsByCode(String code);
    Project save(Project project);
    Page<Project> search(Specification<Project> spec, Pageable pageable);
    /** Dự án chưa xoá (menu Công việc). */
    List<Project> findLive();
}
