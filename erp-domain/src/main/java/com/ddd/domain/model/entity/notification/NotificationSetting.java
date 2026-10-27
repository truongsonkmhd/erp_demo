package com.xxxx.ddd.domain.model.entity.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

/** A user's channels for one notification type; without a row the type's defaults apply. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_notification_setting")
public class NotificationSetting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "type_code", nullable = false, length = 50)
    private String typeCode;

    @Column(name = "in_app", nullable = false)
    private boolean inApp;

    @Column(nullable = false)
    private boolean email;

    @Column(name = "lead_minutes")
    private Integer leadMinutes;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
