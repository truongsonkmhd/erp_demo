package com.xxxx.ddd.application.model.notification;

import lombok.Data;

@Data
public class UpdateNotificationSettingCommand {
    private boolean inApp;
    private boolean email;
    /** Reminder types only; ignored otherwise. */
    private Integer leadMinutes;
}
