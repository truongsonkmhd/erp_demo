package com.xxxx.ddd.application.model.notification;

import lombok.Data;

import java.util.List;

@Data
public class NotificationPageDTO {
    private List<NotificationDTO> items;
    /** Pass back as ?cursor= for the next page; null when there is none. */
    private String nextCursor;
    private long unreadCount;
}
