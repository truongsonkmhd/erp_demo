package com.xxxx.ddd.controller.realtime;

import com.xxxx.ddd.application.vldc.CollectionChangedEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Tells subscribed browsers that a collection changed, only once the write has committed; they then re-fetch it. */
@Component
public class CollectionChangeBroadcaster {
    private final SimpMessagingTemplate messaging;

    public CollectionChangeBroadcaster(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(CollectionChangedEvent event) {
        messaging.convertAndSend(StompAuthInterceptor.TOPIC_PREFIX + event.collection(), event);
    }
}
