package com.xxxx.ddd.infrastructure.persistence.repository.notification;

import com.xxxx.ddd.domain.model.entity.notification.NotificationType;
import com.xxxx.ddd.domain.respository.notification.NotificationTypeRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.notification.NotificationTypeJPAMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class NotificationTypeRepositoryImpl implements NotificationTypeRepository {
    private final NotificationTypeJPAMapper mapper;

    public NotificationTypeRepositoryImpl(NotificationTypeJPAMapper mapper) { this.mapper = mapper; }

    public List<NotificationType> findActive() { return mapper.findByActiveTrueOrderBySortOrderAscCodeAsc(); }

    public Optional<NotificationType> findById(String code) { return mapper.findById(code); }
}
