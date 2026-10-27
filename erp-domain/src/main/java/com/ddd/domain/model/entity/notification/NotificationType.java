package com.xxxx.ddd.domain.model.entity.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** A kind of notification (Lịch đến hạn, Xác nhận thanh toán, ...) and the channels it uses unless a user changes them. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_notification_type")
public class NotificationType {
    @Id
    @Column(length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String description;

    /** lucide-react icon name. */
    @Column(length = 50)
    private String icon;

    @Column(name = "in_app_default", nullable = false)
    private boolean inAppDefault;

    @Column(name = "email_default", nullable = false)
    private boolean emailDefault;

    /** Set only for reminders: minutes before the moment the user is told. */
    @Column(name = "lead_minutes_default")
    private Integer leadMinutesDefault;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean active;

    public boolean isReminder() {
        return leadMinutesDefault != null;
    }
}
