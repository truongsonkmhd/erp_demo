package com.xxxx.ddd.application.notification;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.ZoneId;

@Data
@ConfigurationProperties(prefix = "notification")
public class NotificationProperties {
    /** Business time zone: calendar times are wall-clock times there, whatever the server's own zone. */
    private ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");

    /** A notification younger than this is listed under "Mới", older ones under "Trước đó". */
    private int freshHours = 24;

    /** Base URL of the web app, for links in e-mails. */
    private String publicUrl = "http://localhost:8080";

    private Calendar calendar = new Calendar();

    @Data
    public static class Calendar {
        private boolean enabled = true;
        /** How often the reminder job looks for calendar entries that are due. */
        private long pollMs = 60_000;
        /** Longest lead time a user may choose (also how far ahead the job looks). */
        private int maxLeadMinutes = 7 * 24 * 60;
    }
}
