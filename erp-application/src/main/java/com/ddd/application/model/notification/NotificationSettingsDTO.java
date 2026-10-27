package com.xxxx.ddd.application.model.notification;

import lombok.Data;

import java.util.List;

@Data
public class NotificationSettingsDTO {
    /** Address e-mails go to (the account's e-mail). */
    private String email;
    /** False when the server has no mail account configured: e-mail choices are kept but nothing is sent. */
    private boolean emailAvailable;
    private List<NotificationSettingDTO> types;
}
