package com.xxxx.ddd.application.notification;

/**
 * What a producer wants to say. dedupKey identifies the occurrence (e.g. "CALENDAR_DUE:EV-1:2026-10-27T14:00"):
 * delivering the same key to a user again does nothing, so producers may simply retry.
 */
public record NotificationContent(String title, String body, String link, String refId, String dedupKey) {
}
