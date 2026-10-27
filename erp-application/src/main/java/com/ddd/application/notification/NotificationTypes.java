package com.xxxx.ddd.application.notification;

/** Codes of tbl_notification_type used by producers. A new kind = a row in that table + a constant here. */
public final class NotificationTypes {
    public static final String CALENDAR_DUE = "CALENDAR_DUE";
    public static final String PAYMENT_CONFIRM = "PAYMENT_CONFIRM";
    public static final String EQUIPMENT_TRANSFER = "EQUIPMENT_TRANSFER";
    public static final String MEETING_ROOM = "MEETING_ROOM";
    /** "Phát hành": an announcement written by a unit manager for the units they manage. */
    public static final String INTERNAL_NOTICE = "INTERNAL_NOTICE";

    private NotificationTypes() { }
}
