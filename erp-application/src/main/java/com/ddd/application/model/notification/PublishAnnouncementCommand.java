package com.xxxx.ddd.application.model.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PublishAnnouncementCommand {
    @NotBlank
    @Size(max = 200)
    private String title;

    @NotBlank
    @Size(max = 900)
    private String body;

    /** VLDC page opened from the notification; null = none. */
    @Size(max = 40)
    private String link;

    /** One of AnnouncementOptionsDTO.targets values. */
    @NotBlank
    private String target;

    private boolean important;
}
