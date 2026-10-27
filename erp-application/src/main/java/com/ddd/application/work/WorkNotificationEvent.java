package com.xxxx.ddd.application.work;

import java.util.List;

/**
 * Something about a project, a project task or a mission that people should be told of. Business services only publish
 * it; WorkNotificationListener hands it to the notification module after commit. typeCode is a
 * tbl_notification_type code: PROJECT_APPROVAL, PROJECT_DELETE, TASK_ASSIGNED, TASK_UPDATED, MISSION_APPROVAL. link: the page path the bell opens ("projects/DA-01").
 */
public record WorkNotificationEvent(String typeCode, List<Long> recipientUserIds, String title, String body, String link, String refId) {
}
