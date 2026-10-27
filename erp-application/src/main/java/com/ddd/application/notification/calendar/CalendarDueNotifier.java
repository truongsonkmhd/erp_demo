package com.xxxx.ddd.application.notification.calendar;

import com.xxxx.ddd.application.notification.ChannelPrefs;
import com.xxxx.ddd.application.notification.NotificationContent;
import com.xxxx.ddd.application.notification.NotificationDeliveryService;
import com.xxxx.ddd.application.notification.NotificationProperties;
import com.xxxx.ddd.application.notification.NotificationTypes;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.model.entity.notification.NotificationType;
import com.xxxx.ddd.domain.model.entity.vldc.CalendarEvent;
import com.xxxx.ddd.domain.respository.UserRepository;
import com.xxxx.ddd.domain.respository.vldc.CalendarEventRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * "Lịch đến hạn": every minute, finds calendar entries starting within the longest allowed lead time and tells each
 * person concerned once their own lead time is reached (in the bell and/or by e-mail, as they chose). An entry that
 * is moved gets a new reminder (the dedup key includes its start); one that has started is no longer reminded.
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "notification.calendar", name = "enabled", havingValue = "true", matchIfMissing = true)
public class CalendarDueNotifier {
    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    private final CalendarEventRepository events;
    private final UserRepository users;
    private final NotificationDeliveryService delivery;
    private final NotificationProperties properties;
    private final TransactionTemplate readOnly;

    public CalendarDueNotifier(CalendarEventRepository events, UserRepository users, NotificationDeliveryService delivery,
                               NotificationProperties properties, PlatformTransactionManager transactions) {
        this.events = events;
        this.users = users;
        this.delivery = delivery;
        this.properties = properties;
        this.readOnly = new TransactionTemplate(transactions);
        this.readOnly.setReadOnly(true);
    }

    @Scheduled(fixedDelayString = "${notification.calendar.poll-ms:60000}", initialDelayString = "${notification.calendar.initial-delay-ms:15000}")
    public void run() {
        try {
            int sent = remindDue(LocalDateTime.now(properties.getZone()));
            if (sent > 0) log.info("Calendar reminders sent: {}", sent);
        } catch (RuntimeException e) {
            log.error("Calendar reminder run failed", e);
        }
    }

    /** One pass at the given time; returns how many reminders were recorded. Each delivery commits on its own. */
    public int remindDue(LocalDateTime now) {
        NotificationType type = delivery.activeType(NotificationTypes.CALENDAR_DUE);
        if (type == null) return 0;
        List<Due> due = readOnly.execute(status -> plan(type, now));
        int sent = 0;
        for (Due d : due) {
            try {
                if (delivery.deliver(type, d.user(), d.prefs(), d.content())) sent++;
            } catch (RuntimeException e) {
                log.warn("Calendar reminder {} for user {} failed: {}", d.content().refId(), d.user().getId(), e.getMessage());
            }
        }
        return sent;
    }

    /** Who is due a reminder now; runs in one read-only transaction (recipients need the roles' phòng ban). */
    private List<Due> plan(NotificationType type, LocalDateTime now) {
        List<CalendarEvent> upcoming = events.findStartingBetween(now, now.plusMinutes(properties.getCalendar().getMaxLeadMinutes()));
        if (upcoming.isEmpty()) return List.of();
        List<User> active = users.findAllActive();
        List<Due> due = new ArrayList<>();
        for (CalendarEvent event : upcoming) {
            List<User> recipients = CalendarRecipients.of(event, active);
            if (recipients.isEmpty()) continue;
            Map<Long, ChannelPrefs> prefs = delivery.preferences(type, recipients.stream().map(User::getId).toList());
            NotificationContent content = content(event);
            for (User user : recipients) {
                ChannelPrefs p = prefs.get(user.getId());
                if (p.any() && !now.isBefore(event.getStartsAt().minusMinutes(p.leadMinutes()))) due.add(new Due(user, p, content));
            }
        }
        return due;
    }

    private record Due(User user, ChannelPrefs prefs, NotificationContent content) { }

    private static NotificationContent content(CalendarEvent event) {
        String where = "federation".equals(event.getScope()) ? "Toàn Liên đoàn"
                : "project".equals(event.getScope()) ? "Dự án " + event.getProject()
                : "personal".equals(event.getScope()) ? "Lịch cá nhân" : event.getUnit();
        // No "còn x phút": the text is stored and read later, when such a countdown would be wrong.
        String body = "Bắt đầu lúc " + event.getStartsAt().format(WHEN) + " • " + where
                + (event.getNote() == null || event.getNote().isBlank() ? "" : " — " + event.getNote());
        return new NotificationContent("Lịch sắp diễn ra: " + event.getTitle(), body, "calendar", event.getId(),
                NotificationTypes.CALENDAR_DUE + ":" + event.getId() + ":" + event.getStartsAt());
    }
}
