package com.xxxx.ddd.application.notification;

import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.model.entity.notification.Notification;
import com.xxxx.ddd.domain.model.entity.notification.NotificationSetting;
import com.xxxx.ddd.domain.model.entity.notification.NotificationType;
import com.xxxx.ddd.domain.respository.notification.NotificationRepository;
import com.xxxx.ddd.domain.service.notification.NotificationMailer;
import com.xxxx.ddd.domain.respository.notification.NotificationSettingRepository;
import com.xxxx.ddd.domain.respository.notification.NotificationTypeRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * The one way producers notify people: applies each user's channel choice for the type, skips occurrences already
 * delivered (dedupKey), stores the bell entry and hands e-mail / live push to after-commit listeners.
 */
@Service
public class NotificationDeliveryService {
    private final NotificationTypeRepository types;
    private final NotificationSettingRepository settings;
    private final NotificationRepository notifications;
    private final NotificationMailer mailer;
    private final NotificationProperties properties;
    private final ApplicationEventPublisher events;

    public NotificationDeliveryService(NotificationTypeRepository types, NotificationSettingRepository settings,
                                       NotificationRepository notifications, NotificationMailer mailer,
                                       NotificationProperties properties, ApplicationEventPublisher events) {
        this.types = types;
        this.settings = settings;
        this.notifications = notifications;
        this.mailer = mailer;
        this.properties = properties;
        this.events = events;
    }

    public static ChannelPrefs prefs(NotificationType type, NotificationSetting setting) {
        if (setting == null) return new ChannelPrefs(type.isInAppDefault(), type.isEmailDefault(), type.getLeadMinutesDefault());
        Integer lead = type.isReminder() ? (setting.getLeadMinutes() != null ? setting.getLeadMinutes() : type.getLeadMinutesDefault()) : null;
        return new ChannelPrefs(setting.isInApp(), setting.isEmail(), lead);
    }

    /** Active type or null (a deactivated type sends nothing). */
    @Transactional(readOnly = true)
    public NotificationType activeType(String typeCode) {
        return types.findById(typeCode).filter(NotificationType::isActive).orElse(null);
    }

    /** Each user's channels for the type, in one query. */
    @Transactional(readOnly = true)
    public Map<Long, ChannelPrefs> preferences(NotificationType type, Collection<Long> userIds) {
        Map<Long, NotificationSetting> byUser = settings.findByType(type.getCode(), userIds).stream()
                .collect(Collectors.toMap(NotificationSetting::getUserId, Function.identity()));
        Map<Long, ChannelPrefs> result = new HashMap<>();
        for (Long id : userIds) result.put(id, prefs(type, byUser.get(id)));
        return result;
    }

    /** Returns true when something was recorded for the user (bell entry and/or e-mail). */
    @Transactional
    public boolean deliver(NotificationType type, User user, ChannelPrefs prefs, NotificationContent content) {
        if (!prefs.any() || notifications.exists(user.getId(), content.dedupKey())) return false;
        boolean sendEmail = prefs.email() && mailer.enabled() && hasMailbox(user);
        if (!prefs.inApp() && !sendEmail) return false;
        Notification saved = notifications.save(new Notification()
                .setUserId(user.getId())
                .setTypeCode(type.getCode())
                .setTitle(truncate(content.title(), 255))
                .setBody(truncate(content.body(), 1000))
                .setLink(content.link())
                .setRefId(content.refId())
                .setDedupKey(content.dedupKey())
                .setInApp(prefs.inApp())
                .setEmailStatus(sendEmail ? Notification.EMAIL_PENDING : null)
                .setCreatedAt(LocalDateTime.now(properties.getZone())));
        events.publishEvent(new NotificationCreatedEvent(saved.getId(), user.getUsername(), user.getEmail(), user.getFullName(),
                type.getName(), saved.getTitle(), saved.getBody(), saved.getLink(), prefs.inApp(), sendEmail));
        return true;
    }

    /** For producers without lead times: everyone in users gets the content on the channels they chose. */
    @Transactional
    public int notify(String typeCode, List<User> users, NotificationContent content) {
        NotificationType type = activeType(typeCode);
        if (type == null || users.isEmpty()) return 0;
        Map<Long, ChannelPrefs> prefs = preferences(type, users.stream().map(User::getId).toList());
        int sent = 0;
        for (User user : users) {
            if (deliver(type, user, prefs.get(user.getId()), content)) sent++;
        }
        return sent;
    }

    private static boolean hasMailbox(User user) {
        String email = user.getEmail();
        return email != null && email.indexOf('@') > 0 && !email.contains("_deleted_");
    }

    private static String truncate(String value, int max) {
        if (value == null) return "";
        return value.length() <= max ? value : value.substring(0, max - 1) + "…";
    }
}
