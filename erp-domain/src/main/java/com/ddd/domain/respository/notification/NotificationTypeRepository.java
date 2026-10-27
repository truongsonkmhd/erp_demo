package com.xxxx.ddd.domain.respository.notification;

import com.xxxx.ddd.domain.model.entity.notification.NotificationType;

import java.util.List;
import java.util.Optional;

public interface NotificationTypeRepository {
    /** Active types in display order. */
    List<NotificationType> findActive();

    Optional<NotificationType> findById(String code);
}
