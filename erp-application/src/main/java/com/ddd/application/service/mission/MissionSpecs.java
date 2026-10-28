package com.xxxx.ddd.application.service.mission;

import com.xxxx.ddd.domain.model.entity.work.Mission;
import com.xxxx.ddd.domain.model.enums.work.MissionStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;
import java.util.Locale;

/** Bộ lọc danh sách nhiệm vụ. */
public final class MissionSpecs {
    private MissionSpecs() {
    }

    public static Specification<Mission> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("isDeleted"));
    }

    public static Specification<Mission> status(MissionStatus status) {
        return status == null ? null : (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    /** Mã hoặc tên chứa từ khoá (không phân biệt hoa thường). */
    public static Specification<Mission> keyword(String keyword) {
        if (keyword == null || keyword.isBlank()) return null;
        String like = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
        return (root, query, cb) -> cb.or(cb.like(cb.lower(root.get("code")), like), cb.like(cb.lower(root.get("title")), like));
    }

    /** Nhiệm vụ người dùng thấy: mình lập, mình duyệt, mình phối hợp (followedIds), hoặc thuộc đơn vị mình quản lý. */
    public static Specification<Mission> visibleTo(Long userId, Collection<Long> followedIds, Collection<Long> managedUnitIds) {
        return (root, query, cb) -> {
            var mine = cb.or(cb.equal(root.get("proposerUserId"), userId), cb.equal(root.get("approverUserId"), userId));
            var followed = followedIds.isEmpty() ? cb.disjunction() : root.get("id").in(followedIds);
            var managed = managedUnitIds.isEmpty() ? cb.disjunction() : root.get("departmentId").in(managedUnitIds);
            return cb.or(mine, followed, managed);
        };
    }
}
