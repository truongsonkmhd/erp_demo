package com.xxxx.ddd.domain.model.entity.work;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** Người phối hợp của nhiệm vụ. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_mission_follower")
public class MissionFollower {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mission_id", nullable = false)
    private Long missionId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
