package com.xxxx.ddd.domain.model.entity.work;

import com.xxxx.ddd.domain.model.enums.work.TaskAction;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Nhật ký thao tác của việc; chỉ ghi thêm. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_project_task_activity")
public class ProjectTaskActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "actor_user_id", nullable = false)
    private Long actorUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 30)
    private TaskAction action;

    @Column(name = "from_status", length = 20)
    private String fromStatus;

    @Column(name = "to_status", length = 20)
    private String toStatus;

    @JdbcTypeCode(SqlTypes.TINYINT)
    @Column(name = "progress")
    private Integer progress;

    @Column(name = "note", length = 2000)
    private String note;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
