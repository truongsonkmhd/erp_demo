package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.model.notification.AnnouncementOptionsDTO;
import com.xxxx.ddd.application.model.notification.NotificationPageDTO;
import com.xxxx.ddd.application.model.notification.NotificationSettingDTO;
import com.xxxx.ddd.application.model.notification.NotificationSettingsDTO;
import com.xxxx.ddd.application.model.notification.PublishAnnouncementCommand;
import com.xxxx.ddd.application.model.notification.UpdateNotificationSettingCommand;
import com.xxxx.ddd.application.notification.AnnouncementAppService;
import com.xxxx.ddd.application.notification.NotificationAppService;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** The signed-in user's notifications (bell) and per-type channel settings; every endpoint is scoped to the caller. */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationAppService service;
    private final AnnouncementAppService announcements;

    public NotificationController(NotificationAppService service, AnnouncementAppService announcements) {
        this.service = service;
        this.announcements = announcements;
    }

    /** Newest first; pass nextCursor back as cursor for the next page (lazy loading). */
    @GetMapping
    public ResultMessage<NotificationPageDTO> feed(@RequestParam(required = false) String cursor,
                                                   @RequestParam(defaultValue = "20") int size,
                                                   @RequestParam(defaultValue = "false") boolean unread) {
        return ResultUtil.data(service.feed(cursor, size, unread));
    }

    @GetMapping("/unread-count")
    public ResultMessage<Long> unreadCount() {
        return ResultUtil.data(service.unreadCount());
    }

    /** Returns the remaining unread count. */
    @PostMapping("/{id}/read")
    public ResultMessage<Long> markRead(@PathVariable Long id) {
        return ResultUtil.data(service.markRead(id));
    }

    @PostMapping("/read-all")
    public ResultMessage<Long> markAllRead() {
        return ResultUtil.data(service.markAllRead());
    }

    @GetMapping("/settings")
    public ResultMessage<NotificationSettingsDTO> settings() {
        return ResultUtil.data(service.settings());
    }

    @PutMapping("/settings/{type}")
    public ResultMessage<NotificationSettingDTO> updateSetting(@PathVariable String type, @RequestBody UpdateNotificationSettingCommand command) {
        return ResultUtil.data(service.updateSetting(type, command));
    }

    /** Who the caller may publish to; canPublish = false hides "Phát hành". */
    @GetMapping("/announcements/options")
    public ResultMessage<AnnouncementOptionsDTO> announcementOptions() {
        return ResultUtil.data(announcements.options());
    }

    /** Publishes a thông báo nội bộ to a target the caller manages; returns how many people were notified. */
    @PostMapping("/announcements")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', '" + AnnouncementAppService.PERMISSION + "')")
    public ResultMessage<Integer> publish(@Valid @RequestBody PublishAnnouncementCommand command) {
        return ResultUtil.data(announcements.publish(command));
    }
}
