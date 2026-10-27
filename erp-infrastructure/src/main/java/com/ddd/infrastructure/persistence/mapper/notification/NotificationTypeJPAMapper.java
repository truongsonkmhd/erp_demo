package com.xxxx.ddd.infrastructure.persistence.mapper.notification;

import com.xxxx.ddd.domain.model.entity.notification.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationTypeJPAMapper extends JpaRepository<NotificationType, String> {
    List<NotificationType> findByActiveTrueOrderBySortOrderAscCodeAsc();
}
