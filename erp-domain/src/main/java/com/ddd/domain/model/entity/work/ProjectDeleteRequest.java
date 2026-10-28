package com.xxxx.ddd.domain.model.entity.work;

import com.xxxx.ddd.domain.model.enums.work.DeleteRequestStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** Đề nghị xoá dự án: Phòng Kỹ thuật đề nghị, Liên đoàn trưởng quyết; mỗi lần một dòng. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_project_delete_request")
public class ProjectDeleteRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "reason", nullable = false, length = 1000)
    private String reason;

    @Column(name = "requested_by", nullable = false)
    private Long requestedBy;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DeleteRequestStatus status = DeleteRequestStatus.PENDING;

    @Column(name = "decided_by")
    private Long decidedBy;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    /** Lý do không xoá. */
    @Column(name = "decision_note", length = 1000)
    private String decisionNote;
}
