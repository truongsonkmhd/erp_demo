package com.xxxx.ddd.domain.model.entity.work;

import com.xxxx.ddd.domain.model.enums.work.ApprovalStatus;
import com.xxxx.ddd.domain.model.enums.work.ProjectStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** Dự án. Mã (code) do Phòng Kỹ thuật nhập; người và đơn vị lưu dạng id. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_project")
public class Project extends AuditedEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã dự án do người dùng nhập, không đổi sau khi tạo. */
    @Column(name = "code", nullable = false, updatable = false, length = 30)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    /** Mục tiêu và phạm vi. */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Đơn vị chủ trì. */
    @Column(name = "lead_department_id", nullable = false)
    private Long leadDepartmentId;

    /** Chủ nhiệm dự án. */
    @Column(name = "manager_user_id")
    private Long managerUserId;

    /** Ngân sách dự kiến (đồng). */
    @Column(name = "estimated_budget", nullable = false)
    private BigDecimal estimatedBudget;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ProjectStatus status = ProjectStatus.INITIATED;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    /** Lý do không duyệt. */
    @Column(name = "approval_note", length = 1000)
    private String approvalNote;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
}
