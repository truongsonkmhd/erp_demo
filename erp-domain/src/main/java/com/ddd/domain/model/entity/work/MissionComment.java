package com.xxxx.ddd.domain.model.entity.work;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** Ghi chú của nhiệm vụ; departmentId là đơn vị người ghi lúc ghi. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_mission_comment")
public class MissionComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mission_id", nullable = false)
    private Long missionId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
}
