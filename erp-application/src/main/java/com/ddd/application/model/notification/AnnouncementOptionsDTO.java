package com.xxxx.ddd.application.model.notification;

import lombok.Data;

import java.util.List;

/** What the signed-in user may publish: empty targets = not allowed. */
@Data
public class AnnouncementOptionsDTO {
    private boolean canPublish;
    private List<Target> targets;

    /** value: "federation" or "unit:{departmentId}". */
    public record Target(String value, String label) { }
}
