package com.xxxx.ddd.domain.model.entity.work;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Cột kiểm toán và xoá mềm của bảng chính (dự án, việc, nhiệm vụ). Thời gian tự đặt; người làm (createdBy,
 * updatedBy) do service đặt từ người dùng đăng nhập.
 */
@Getter
@Setter
@MappedSuperclass
public abstract class AuditedEntity {
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, updatable = false)
    private Long createdBy;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by")
    private Long deletedBy;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /** Xoá mềm: bản ghi ẩn khỏi mọi danh sách nhưng vẫn giữ để tra cứu. */
    public void softDelete(Long userId) {
        isDeleted = true;
        deletedAt = LocalDateTime.now();
        deletedBy = userId;
    }

    public boolean deleted() {
        return Boolean.TRUE.equals(isDeleted);
    }
}
