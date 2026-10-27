package com.xxxx.ddd.application.service.project;

import com.xxxx.ddd.domain.model.entity.work.Project;
import com.xxxx.ddd.domain.model.enums.work.ApprovalStatus;
import com.xxxx.ddd.domain.model.enums.work.ProjectStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;
import java.util.Locale;

/** Bộ lọc danh sách dự án. */
public final class ProjectSpecs {
    private ProjectSpecs() {
    }

    public static Specification<Project> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("isDeleted"));
    }

    public static Specification<Project> status(ProjectStatus status) {
        return status == null ? null : (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    /** Mã hoặc tên chứa từ khoá (không phân biệt hoa thường). */
    public static Specification<Project> keyword(String keyword) {
        if (keyword == null || keyword.isBlank()) return null;
        String like = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
        return (root, query, cb) -> cb.or(cb.like(cb.lower(root.get("code")), like), cb.like(cb.lower(root.get("name")), like));
    }

    /**
     * Dự án đơn vị được xem: đã duyệt và đơn vị là đơn vị chủ trì hoặc đơn vị phối hợp (coProjectIds). Phòng Kỹ thuật và
     * Liên đoàn trưởng không dùng bộ lọc này (thấy tất cả).
     */
    public static Specification<Project> visibleToUnit(Long departmentId, Collection<Long> coProjectIds) {
        return (root, query, cb) -> {
            var approved = cb.equal(root.get("approvalStatus"), ApprovalStatus.APPROVED);
            var lead = departmentId == null ? cb.disjunction() : cb.equal(root.get("leadDepartmentId"), departmentId);
            var co = coProjectIds.isEmpty() ? cb.disjunction() : root.get("id").in(coProjectIds);
            return cb.and(approved, cb.or(lead, co));
        };
    }
}
