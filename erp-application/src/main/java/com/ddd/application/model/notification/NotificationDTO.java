package com.xxxx.ddd.application.model.notification;

import lombok.Data;

@Data
public class NotificationDTO {
    private Long id;
    private String type;
    private String typeName;
    /** lucide-react icon name of the type. */
    private String icon;
    private String title;
    private String body;
    /** VLDC page to open, e.g. "calendar". */
    private String link;
    /** ISO local date-time in the business zone. */
    private String createdAt;
    private boolean read;
    /** Listed under "Mới" (recent) rather than "Trước đó". */
    private boolean fresh;
}
