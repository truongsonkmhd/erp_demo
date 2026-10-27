package com.xxxx.ddd.application.model.notification;

import lombok.Data;

/** One notification type with the signed-in user's channels for it. */
@Data
public class NotificationSettingDTO {
    private String type;
    private String name;
    private String description;
    private String icon;
    private boolean inApp;
    private boolean email;
    /** Reminder types only: minutes before the moment; null otherwise. */
    private Integer leadMinutes;
    private boolean reminder;
}
