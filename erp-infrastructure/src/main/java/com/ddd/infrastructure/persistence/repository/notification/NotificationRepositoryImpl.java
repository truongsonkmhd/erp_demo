package com.xxxx.ddd.infrastructure.persistence.repository.notification;

import com.xxxx.ddd.domain.model.entity.notification.Notification;
import com.xxxx.ddd.domain.respository.notification.NotificationRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.notification.NotificationJPAMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class NotificationRepositoryImpl implements NotificationRepository {
    private final NotificationJPAMapper mapper;

    public NotificationRepositoryImpl(NotificationJPAMapper mapper) { this.mapper = mapper; }

    public Notification save(Notification notification) { return mapper.save(notification); }

    public Optional<Notification> findById(Long id) { return mapper.findById(id); }

    public boolean exists(Long userId, String dedupKey) { return mapper.existsByUserIdAndDedupKey(userId, dedupKey); }

    public List<Notification> feed(Long userId, boolean unreadOnly, LocalDateTime cursorAt, Long cursorId, int limit) {
        PageRequest page = PageRequest.of(0, limit);
        return cursorAt == null
                ? mapper.firstPage(userId, unreadOnly, page)
                : mapper.pageAfter(userId, unreadOnly, cursorAt, cursorId, page);
    }

    public long countUnread(Long userId) { return mapper.countUnread(userId); }

    public int markRead(Long userId, Long id, LocalDateTime at) { return mapper.markRead(userId, id, at); }

    public int markAllRead(Long userId, LocalDateTime at) { return mapper.markAllRead(userId, at); }

    public void updateEmailStatus(Long id, String status) { mapper.updateEmailStatus(id, status); }
}
