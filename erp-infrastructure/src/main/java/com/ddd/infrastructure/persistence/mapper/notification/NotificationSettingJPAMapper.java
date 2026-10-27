package com.xxxx.ddd.infrastructure.persistence.mapper.notification;

import com.xxxx.ddd.domain.model.entity.notification.NotificationSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface NotificationSettingJPAMapper extends JpaRepository<NotificationSetting, Long> {
    List<NotificationSetting> findByUserId(Long userId);

    Optional<NotificationSetting> findByUserIdAndTypeCode(Long userId, String typeCode);

    List<NotificationSetting> findByTypeCodeAndUserIdIn(String typeCode, Collection<Long> userIds);
}
