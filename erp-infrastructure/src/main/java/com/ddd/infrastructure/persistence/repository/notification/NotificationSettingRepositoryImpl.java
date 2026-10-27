package com.xxxx.ddd.infrastructure.persistence.repository.notification;

import com.xxxx.ddd.domain.model.entity.notification.NotificationSetting;
import com.xxxx.ddd.domain.respository.notification.NotificationSettingRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.notification.NotificationSettingJPAMapper;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public class NotificationSettingRepositoryImpl implements NotificationSettingRepository {
    private final NotificationSettingJPAMapper mapper;

    public NotificationSettingRepositoryImpl(NotificationSettingJPAMapper mapper) { this.mapper = mapper; }

    public List<NotificationSetting> findByUser(Long userId) { return mapper.findByUserId(userId); }

    public Optional<NotificationSetting> find(Long userId, String typeCode) { return mapper.findByUserIdAndTypeCode(userId, typeCode); }

    public List<NotificationSetting> findByType(String typeCode, Collection<Long> userIds) {
        return userIds.isEmpty() ? List.of() : mapper.findByTypeCodeAndUserIdIn(typeCode, userIds);
    }

    public NotificationSetting save(NotificationSetting setting) { return mapper.save(setting); }
}
