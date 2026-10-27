package com.xxxx.ddd.controller.realtime;

import com.xxxx.ddd.application.notification.NotificationCreatedEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

/** Rings the recipient's bell once the notification is committed; the browser then re-fetches (no content on the wire). */
@Component
public class NotificationBroadcaster {
    /** Each session only receives its own user's messages (Spring user destinations). */
    static final String QUEUE = "/queue/notifications";

    private final SimpMessagingTemplate messaging;

    public NotificationBroadcaster(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(NotificationCreatedEvent event) {
        if (event.inApp()) messaging.convertAndSendToUser(event.username(), QUEUE, Map.of("id", event.notificationId()));
    }
}
