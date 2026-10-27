package com.xxxx.ddd.application.notification;

import com.xxxx.ddd.application.exception.NotFoundException;
import com.xxxx.ddd.application.model.notification.NotificationDTO;
import com.xxxx.ddd.application.model.notification.NotificationPageDTO;
import com.xxxx.ddd.application.model.notification.NotificationSettingDTO;
import com.xxxx.ddd.application.model.notification.NotificationSettingsDTO;
import com.xxxx.ddd.application.model.notification.UpdateNotificationSettingCommand;
import com.xxxx.ddd.application.service.security.CurrentActor;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.model.entity.notification.Notification;
import com.xxxx.ddd.domain.model.entity.notification.NotificationSetting;
import com.xxxx.ddd.domain.model.entity.notification.NotificationType;
import com.xxxx.ddd.domain.respository.notification.NotificationRepository;
import com.xxxx.ddd.domain.service.notification.NotificationMailer;
import com.xxxx.ddd.domain.respository.notification.NotificationSettingRepository;
import com.xxxx.ddd.domain.respository.notification.NotificationTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** The signed-in user's bell (lazy-loaded feed, read state) and notification settings. */
@Service
public class NotificationAppService {
    public static final int MAX_PAGE = 50;

    private final CurrentActor currentActor;
    private final NotificationRepository notifications;
    private final NotificationTypeRepository types;
    private final NotificationSettingRepository settings;
    private final NotificationMailer mailer;
    private final NotificationProperties properties;

    public NotificationAppService(CurrentActor currentActor, NotificationRepository notifications, NotificationTypeRepository types,
                                  NotificationSettingRepository settings, NotificationMailer mailer, NotificationProperties properties) {
        this.currentActor = currentActor;
        this.notifications = notifications;
        this.types = types;
        this.settings = settings;
        this.mailer = mailer;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    public NotificationPageDTO feed(String cursor, int size, boolean unreadOnly) {
        Long userId = currentActor.require().getId();
        int limit = Math.min(Math.max(size, 1), MAX_PAGE);
        Cursor after = Cursor.parse(cursor);
        // One extra row tells whether another page exists without a COUNT.
        List<Notification> rows = notifications.feed(userId, unreadOnly, after == null ? null : after.at(), after == null ? null : after.id(), limit + 1);
        boolean more = rows.size() > limit;
        List<Notification> page = more ? rows.subList(0, limit) : rows;
        Map<String, NotificationType> typeByCode = typeMap();
        LocalDateTime freshSince = LocalDateTime.now(properties.getZone()).minusHours(properties.getFreshHours());

        NotificationPageDTO dto = new NotificationPageDTO();
        dto.setItems(page.stream().map(n -> toDto(n, typeByCode.get(n.getTypeCode()), freshSince)).toList());
        dto.setNextCursor(more ? Cursor.of(page.get(page.size() - 1)) : null);
        dto.setUnreadCount(notifications.countUnread(userId));
        return dto;
    }

    @Transactional(readOnly = true)
    public long unreadCount() {
        return notifications.countUnread(currentActor.require().getId());
    }

    /** Returns the new unread count. Reading someone else's notification is a no-op that looks like "not found". */
    @Transactional
    public long markRead(Long id) {
        Long userId = currentActor.require().getId();
        Notification n = notifications.findById(id).filter(x -> x.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Notification not found"));
        if (n.getReadAt() == null) notifications.markRead(userId, id, LocalDateTime.now(properties.getZone()));
        return notifications.countUnread(userId);
    }

    @Transactional
    public long markAllRead() {
        Long userId = currentActor.require().getId();
        notifications.markAllRead(userId, LocalDateTime.now(properties.getZone()));
        return 0;
    }

    @Transactional(readOnly = true)
    public NotificationSettingsDTO settings() {
        User user = currentActor.require();
        Map<String, NotificationSetting> mine = settings.findByUser(user.getId()).stream()
                .collect(Collectors.toMap(NotificationSetting::getTypeCode, Function.identity()));
        NotificationSettingsDTO dto = new NotificationSettingsDTO();
        dto.setEmail(user.getEmail());
        dto.setEmailAvailable(mailer.enabled());
        dto.setTypes(types.findActive().stream().map(t -> toSettingDto(t, mine.get(t.getCode()))).toList());
        return dto;
    }

    @Transactional
    public NotificationSettingDTO updateSetting(String typeCode, UpdateNotificationSettingCommand command) {
        User user = currentActor.require();
        NotificationType type = types.findById(typeCode).filter(NotificationType::isActive)
                .orElseThrow(() -> new NotFoundException("Unknown notification type: " + typeCode));
        Integer lead = null;
        if (type.isReminder()) {
            lead = command.getLeadMinutes() == null ? type.getLeadMinutesDefault() : command.getLeadMinutes();
            if (lead < 1 || lead > properties.getCalendar().getMaxLeadMinutes()) {
                throw new IllegalArgumentException("leadMinutes must be between 1 and " + properties.getCalendar().getMaxLeadMinutes());
            }
        }
        NotificationSetting setting = settings.find(user.getId(), typeCode)
                .orElseGet(() -> new NotificationSetting().setUserId(user.getId()).setTypeCode(typeCode));
        setting.setInApp(command.isInApp()).setEmail(command.isEmail()).setLeadMinutes(lead)
                .setUpdatedAt(LocalDateTime.now(properties.getZone()));
        return toSettingDto(type, settings.save(setting));
    }

    private Map<String, NotificationType> typeMap() {
        return types.findActive().stream().collect(Collectors.toMap(NotificationType::getCode, Function.identity()));
    }

    private static NotificationDTO toDto(Notification n, NotificationType type, LocalDateTime freshSince) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(n.getId());
        dto.setType(n.getTypeCode());
        dto.setTypeName(type == null ? n.getTypeCode() : type.getName());
        dto.setIcon(type == null ? null : type.getIcon());
        dto.setTitle(n.getTitle());
        dto.setBody(n.getBody());
        dto.setLink(n.getLink());
        dto.setCreatedAt(n.getCreatedAt().toString());
        dto.setRead(n.getReadAt() != null);
        dto.setFresh(!n.getCreatedAt().isBefore(freshSince));
        return dto;
    }

    private static NotificationSettingDTO toSettingDto(NotificationType type, NotificationSetting setting) {
        ChannelPrefs prefs = NotificationDeliveryService.prefs(type, setting);
        NotificationSettingDTO dto = new NotificationSettingDTO();
        dto.setType(type.getCode());
        dto.setName(type.getName());
        dto.setDescription(type.getDescription());
        dto.setIcon(type.getIcon());
        dto.setInApp(prefs.inApp());
        dto.setEmail(prefs.email());
        dto.setLeadMinutes(prefs.leadMinutes());
        dto.setReminder(type.isReminder());
        return dto;
    }

    /** Opaque keyset cursor: the last row's (createdAt, id). */
    record Cursor(LocalDateTime at, Long id) {
        static String of(Notification n) {
            String raw = n.getCreatedAt() + "|" + n.getId();
            return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
        }

        static Cursor parse(String cursor) {
            if (cursor == null || cursor.isBlank()) return null;
            try {
                String raw = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
                int bar = raw.indexOf('|');
                return new Cursor(LocalDateTime.parse(raw.substring(0, bar)), Long.parseLong(raw.substring(bar + 1)));
            } catch (IllegalArgumentException | IndexOutOfBoundsException | DateTimeParseException e) {
                throw new IllegalArgumentException("Invalid cursor");
            }
        }
    }
}
