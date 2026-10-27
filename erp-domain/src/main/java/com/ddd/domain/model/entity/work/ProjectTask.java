package com.xxxx.ddd.domain.model.entity.work;

import com.xxxx.ddd.domain.model.enums.work.Complexity;
import com.xxxx.ddd.domain.model.enums.work.Priority;
import com.xxxx.ddd.domain.model.enums.work.TaskStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Việc trong dự án (Dự án → Việc); createdBy là trưởng phòng giao việc. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_project_task")
public class ProjectTask extends AuditedEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã việc do người dùng nhập, không đổi sau khi tạo. */
    @Column(name = "code", nullable = false, updatable = false, length = 30)
    private String code;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    /** Không dùng: việc chỉ có 2 cấp Dự án → Việc (cột giữ lại trong bảng). */
    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "title", nullable = false, length = 1000)
    private String title;

    /** Kết quả / minh chứng yêu cầu. */
    @Column(name = "result_requirement", columnDefinition = "TEXT")
    private String resultRequirement;

    /** Đơn vị thực hiện. */
    @Column(name = "department_id", nullable = false)
    private Long departmentId;

    /** Người thực hiện. */
    @Column(name = "assignee_user_id", nullable = false)
    private Long assigneeUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TaskStatus status = TaskStatus.NEW;

    @JdbcTypeCode(SqlTypes.TINYINT)
    @Column(name = "progress", nullable = false)
    private Integer progress = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "complexity", nullable = false, length = 20)
    private Complexity complexity = Complexity.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private Priority priority = Priority.MEDIUM;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    /** Minh chứng đã nộp. */
    @Column(name = "evidence", length = 2000)
    private String evidence;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
