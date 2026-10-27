package com.xxxx.ddd.infrastructure.persistence.mapper.notification;

import com.xxxx.ddd.domain.model.entity.notification.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/** Feed queries follow idx_notification_feed (user_id, in_app, created_at, id). */
public interface NotificationJPAMapper extends JpaRepository<Notification, Long> {
    boolean existsByUserIdAndDedupKey(Long userId, String dedupKey);

    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.inApp = true AND (:unread = false OR n.readAt IS NULL) "
            + "ORDER BY n.createdAt DESC, n.id DESC")
    List<Notification> firstPage(@Param("userId") Long userId, @Param("unread") boolean unreadOnly, Pageable page);

    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.inApp = true AND (:unread = false OR n.readAt IS NULL) "
            + "AND (n.createdAt < :at OR (n.createdAt = :at AND n.id < :id)) ORDER BY n.createdAt DESC, n.id DESC")
    List<Notification> pageAfter(@Param("userId") Long userId, @Param("unread") boolean unreadOnly,
                                 @Param("at") LocalDateTime cursorAt, @Param("id") Long cursorId, Pageable page);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.userId = :userId AND n.inApp = true AND n.readAt IS NULL")
    long countUnread(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = :at WHERE n.id = :id AND n.userId = :userId AND n.readAt IS NULL")
    int markRead(@Param("userId") Long userId, @Param("id") Long id, @Param("at") LocalDateTime at);

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = :at WHERE n.userId = :userId AND n.inApp = true AND n.readAt IS NULL")
    int markAllRead(@Param("userId") Long userId, @Param("at") LocalDateTime at);

    @Modifying
    @Query("UPDATE Notification n SET n.emailStatus = :status WHERE n.id = :id")
    int updateEmailStatus(@Param("id") Long id, @Param("status") String status);
}
