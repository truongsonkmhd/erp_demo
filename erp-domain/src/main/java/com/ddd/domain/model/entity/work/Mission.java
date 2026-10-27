package com.xxxx.ddd.domain.model.entity.work;

import com.xxxx.ddd.domain.model.enums.work.MissionStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Nhiệm vụ: cấp dưới đề xuất, cấp trên trực tiếp duyệt; người đề xuất cũng là người thực hiện. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_mission")
public class Mission extends AuditedEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã nhiệm vụ do người dùng nhập, không đổi sau khi tạo. */
    @Column(name = "code", nullable = false, updatable = false, length = 30)
    private String code;

    @Column(name = "title", nullable = false, length = 1000)
    private String title;

    /** Nội dung, lý do, kết quả dự kiến. */
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    /** Đơn vị / tổ đội thực hiện (mặc định đơn vị người lập). */
    @Column(name = "department_id", nullable = false)
    private Long departmentId;

    /** Người lập (đề xuất) nhiệm vụ, cũng là người thực hiện. */
    @Column(name = "proposer_user_id", nullable = false)
    private Long proposerUserId;

    @Column(name = "approver_user_id", nullable = false)
    private Long approverUserId;

    /** Gắn dự án (không bắt buộc). */
    @Column(name = "project_id")
    private Long projectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private MissionStatus status = MissionStatus.PENDING;

    /** Lý do từ chối. */
    @Column(name = "decision_note", length = 1000)
    private String decisionNote;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @JdbcTypeCode(SqlTypes.TINYINT)
    @Column(name = "progress", nullable = false)
    private Integer progress = 0;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "evidence", length = 2000)
    private String evidence;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
