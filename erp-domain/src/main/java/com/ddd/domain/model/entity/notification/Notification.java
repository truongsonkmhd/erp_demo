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

/** One notification for one user. A row with inApp = false only records the e-mail and blocks a duplicate. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_notification")
public class Notification {
    public static final String EMAIL_PENDING = "PENDING";
    public static final String EMAIL_SENT = "SENT";
    public static final String EMAIL_FAILED = "FAILED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "type_code", nullable = false, length = 50)
    private String typeCode;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String body;

    /** VLDC page opened from the notification, e.g. "calendar". */
    private String link;

    @Column(name = "ref_id", length = 64)
    private String refId;

    /** Unique per user: the same event never notifies a user twice. */
    @Column(name = "dedup_key", nullable = false, length = 191)
    private String dedupKey;

    @Column(name = "in_app", nullable = false)
    private boolean inApp;

    /** Null when no e-mail was requested. */
    @Column(name = "email_status", length = 16)
    private String emailStatus;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;
}
