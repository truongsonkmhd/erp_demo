package com.xxxx.ddd.application.notification;

/** Published inside the delivering transaction; listeners act after commit (bell push, e-mail). */
public record NotificationCreatedEvent(Long notificationId, String username, String email, String fullName, String typeName,
                                       String title, String body, String link, boolean inApp, boolean sendEmail) {
}
