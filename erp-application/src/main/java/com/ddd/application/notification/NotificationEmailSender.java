package com.xxxx.ddd.application.notification;

import com.xxxx.ddd.domain.model.entity.notification.Notification;
import com.xxxx.ddd.domain.respository.notification.NotificationRepository;
import com.xxxx.ddd.domain.service.notification.NotificationMailer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Sends the e-mail of a delivered notification once its row is committed, off the caller's thread. */
@Slf4j
@Component
public class NotificationEmailSender {
    private final NotificationMailer mailer;
    private final NotificationRepository notifications;
    private final NotificationProperties properties;

    public NotificationEmailSender(NotificationMailer mailer, NotificationRepository notifications, NotificationProperties properties) {
        this.mailer = mailer;
        this.notifications = notifications;
        this.properties = properties;
    }

    @Async(NotificationConfig.EXECUTOR)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(NotificationCreatedEvent event) {
        if (!event.sendEmail()) return;
        String status;
        try {
            mailer.send(event.email(), "[VLDC] " + event.title(), html(event));
            status = Notification.EMAIL_SENT;
        } catch (RuntimeException e) {
            log.warn("Notification e-mail {} to {} failed: {}", event.notificationId(), event.email(), e.getMessage());
            status = Notification.EMAIL_FAILED;
        }
        notifications.updateEmailStatus(event.notificationId(), status);
    }

    private String html(NotificationCreatedEvent e) {
        String base = properties.getPublicUrl().replaceAll("/+$", "");
        String url = base + "/vldc/" + (e.link() == null || e.link().isBlank() ? "dashboard" : e.link());
        return """
                <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#17324b">
                  <div style="background:#082b46;color:#fff;padding:14px 20px;border-radius:12px 12px 0 0;font-weight:700">VLDC ERP • %s</div>
                  <div style="border:1px solid #dce6ef;border-top:0;border-radius:0 0 12px 12px;padding:20px">
                    <p style="margin:0 0 6px">Xin chào %s,</p>
                    <h2 style="margin:12px 0 8px;font-size:18px">%s</h2>
                    <p style="margin:0 0 18px;line-height:1.6;color:#33506a">%s</p>
                    <a href="%s" style="display:inline-block;background:#076bb6;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700">Mở trên hệ thống</a>
                    <p style="margin:22px 0 0;font-size:12px;color:#6e8192">Bạn nhận e-mail này theo cài đặt thông báo của mình. Có thể tắt tại mục Quản lý thông báo.</p>
                  </div>
                </div>
                """.formatted(esc(e.typeName()), esc(e.fullName() == null ? "" : e.fullName()), esc(e.title()),
                esc(e.body()), esc(url));
    }

    private static String esc(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
    }
}
