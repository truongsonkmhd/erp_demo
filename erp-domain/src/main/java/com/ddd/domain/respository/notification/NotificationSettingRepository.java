package com.xxxx.ddd.domain.respository.notification;

import com.xxxx.ddd.domain.model.entity.notification.NotificationSetting;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface NotificationSettingRepository {
    List<NotificationSetting> findByUser(Long userId);

    Optional<NotificationSetting> find(Long userId, String typeCode);

    /** One query for a whole recipient list. */
    List<NotificationSetting> findByType(String typeCode, Collection<Long> userIds);

    NotificationSetting save(NotificationSetting setting);
}
