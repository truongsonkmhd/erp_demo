package com.xxxx.ddd.domain.service.notification;

/** Sends one HTML e-mail (implemented over SMTP, e.g. Gmail, in the infrastructure layer). */
public interface NotificationMailer {
    /** False when no mail server is configured: e-mail channels are then skipped, not failed. */
    boolean enabled();

    /** Throws on failure. */
    void send(String to, String subject, String html);
}
