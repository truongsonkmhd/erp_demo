package com.xxxx.ddd.application.service.task;

import com.xxxx.ddd.domain.model.entity.work.ProjectTask;
import com.xxxx.ddd.domain.model.enums.work.TaskStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.Locale;

/** Bộ lọc danh sách việc của một dự án. */
public final class TaskSpecs {
    private TaskSpecs() {
    }

    public static Specification<ProjectTask> liveOfProject(Long projectId) {
        return (root, query, cb) -> cb.and(cb.equal(root.get("projectId"), projectId), cb.isFalse(root.get("isDeleted")));
    }

    public static Specification<ProjectTask> status(TaskStatus status) {
        return status == null ? null : (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    /** Mã hoặc tên việc chứa từ khoá (không phân biệt hoa thường). */
    public static Specification<ProjectTask> keyword(String keyword) {
        if (keyword == null || keyword.isBlank()) return null;
        String like = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
        return (root, query, cb) -> cb.or(cb.like(cb.lower(root.get("code")), like), cb.like(cb.lower(root.get("title")), like));
    }
}
