package com.xxxx.ddd.application.work;

import java.util.List;

/**
 * Something about a project, a project task or a mission that people should be told of. Business services only publish
 * it; the notification module (owned by another teammate) listens and writes tbl_notification. typeCode is a
 * tbl_notification_type code: PROJECT_APPROVAL, PROJECT_DELETE, TASK_ASSIGNED, TASK_UPDATED, MISSION_APPROVAL.
 */
public record WorkNotificationEvent(String typeCode, List<Long> recipientUserIds, String title, String body, String link, String refId) {
}
