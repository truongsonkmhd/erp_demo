package com.xxxx.ddd.application.work;

import com.xxxx.ddd.application.notification.NotificationContent;
import com.xxxx.ddd.application.notification.NotificationDeliveryService;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.respository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Turns what the project / task / mission services report into notifications (bell and e-mail, per each person's
 * settings). Runs once the action is committed, in its own transaction: a failed notification is logged and never
 * undoes the action.
 */
@Slf4j
@Component
public class WorkNotificationListener {
    private final NotificationDeliveryService delivery;
    private final UserRepository users;
    private final TransactionTemplate tx;

    public WorkNotificationListener(NotificationDeliveryService delivery, UserRepository users, PlatformTransactionManager transactions) {
        this.delivery = delivery;
        this.users = users;
        this.tx = new TransactionTemplate(transactions);
        this.tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(WorkNotificationEvent event) {
        try {
            Integer sent = tx.execute(status -> send(event));
            log.debug("{} {} sent to {} people", event.typeCode(), event.refId(), sent);
        } catch (RuntimeException e) {
            log.warn("Notification {} for {} failed: {}", event.typeCode(), event.refId(), e.getMessage());
        }
    }

    /** Active people among the recipients, each once; one occurrence per event (the same action is never retried). */
    int send(WorkNotificationEvent event) {
        List<User> to = new LinkedHashSet<>(event.recipientUserIds()).stream().filter(Objects::nonNull)
                .map(users::findById).flatMap(Optional::stream)
                .filter(u -> !Boolean.FALSE.equals(u.getActive()) && !Boolean.TRUE.equals(u.getIsDeleted())).toList();
        if (to.isEmpty()) return 0;
        String key = event.typeCode() + ":" + event.refId() + ":" + UUID.randomUUID();
        return delivery.notify(event.typeCode(), to, new NotificationContent(event.title(), event.body(), event.link(), event.refId(), key));
    }
}
