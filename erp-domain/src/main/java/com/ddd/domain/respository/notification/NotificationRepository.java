package com.xxxx.ddd.domain.respository.notification;

import com.xxxx.ddd.domain.model.entity.notification.Notification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository {
    Notification save(Notification notification);

    Optional<Notification> findById(Long id);

    boolean exists(Long userId, String dedupKey);

    /**
     * The user's in-app notifications, newest first, strictly after the (createdAt, id) cursor when one is given
     * (keyset pagination: stable while new rows arrive, no OFFSET scan).
     */
    List<Notification> feed(Long userId, boolean unreadOnly, LocalDateTime cursorAt, Long cursorId, int limit);

    long countUnread(Long userId);

    /** Returns 1 when the notification was unread and belongs to the user, else 0. */
    int markRead(Long userId, Long id, LocalDateTime at);

    int markAllRead(Long userId, LocalDateTime at);

    void updateEmailStatus(Long id, String status);
}
