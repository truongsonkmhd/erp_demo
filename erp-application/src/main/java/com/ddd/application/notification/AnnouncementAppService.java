package com.xxxx.ddd.application.notification;

import com.xxxx.ddd.application.model.notification.AnnouncementOptionsDTO;
import com.xxxx.ddd.application.model.notification.PublishAnnouncementCommand;
import com.xxxx.ddd.application.service.audit.AuditAppService;
import com.xxxx.ddd.application.service.security.CurrentActor;
import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.UserRepository;
import com.xxxx.ddd.domain.service.AuthorizationService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * "Phát hành" thông báo nội bộ. The function needs vldc-notifications:create; the audience is limited by the
 * shared scope rule (đặc tả 6.3): the units the publisher manages (own unit and below). Managing the whole tree,
 * or being admin, also allows "Toàn Liên đoàn". Everything is re-checked here, whatever the client offered.
 */
@Service
public class AnnouncementAppService {
    public static final String PERMISSION = "vldc-notifications:create";
    static final String FEDERATION = "federation";
    static final String UNIT = "unit:";
    /** Pages an announcement may open. */
    static final Set<String> LINKS = Set.of("dashboard", "calendar", "plans", "action", "directives", "projects", "documents", "news");

    private final CurrentActor currentActor;
    private final AuthorizationService authorization;
    private final DepartmentRepository departments;
    private final UserRepository users;
    private final NotificationDeliveryService delivery;
    private final AuditAppService audit;

    public AnnouncementAppService(CurrentActor currentActor, AuthorizationService authorization, DepartmentRepository departments,
                                  UserRepository users, NotificationDeliveryService delivery, AuditAppService audit) {
        this.currentActor = currentActor;
        this.authorization = authorization;
        this.departments = departments;
        this.users = users;
        this.delivery = delivery;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public AnnouncementOptionsDTO options() {
        AnnouncementOptionsDTO dto = new AnnouncementOptionsDTO();
        dto.setTargets(mayPublish() ? targets(currentActor.require()) : List.of());
        dto.setCanPublish(!dto.getTargets().isEmpty());
        return dto;
    }

    /** Returns how many people were notified. */
    @Transactional
    public int publish(PublishAnnouncementCommand command) {
        if (!mayPublish()) throw new AccessDeniedException("Not allowed to publish notifications");
        User sender = currentActor.require();
        String target = command.getTarget();
        if (targets(sender).stream().noneMatch(t -> t.value().equals(target))) {
            throw new AccessDeniedException("Not allowed to publish to " + target);
        }
        String link = command.getLink() == null || command.getLink().isBlank() ? null : command.getLink().trim();
        if (link != null && !LINKS.contains(link)) throw new IllegalArgumentException("Unknown link: " + link);

        List<User> recipients = recipients(target).stream().filter(u -> !Objects.equals(u.getId(), sender.getId())).toList();
        String title = (command.isImportant() ? "Quan trọng: " : "") + command.getTitle().trim();
        String body = command.getBody().trim() + "\n— " + sender.getFullName();
        int sent = delivery.notify(NotificationTypes.INTERNAL_NOTICE, recipients,
                new NotificationContent(title, body, link, null, NotificationTypes.INTERNAL_NOTICE + ":" + UUID.randomUUID()));
        audit.record("announce", AuditAppService.NOTIFICATION, null,
                "target=" + target + " recipients=" + recipients.size() + " delivered=" + sent + " title=" + command.getTitle().trim());
        return sent;
    }

    private static boolean mayPublish() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()) || PERMISSION.equals(a.getAuthority()));
    }

    private static boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private List<AnnouncementOptionsDTO.Target> targets(User user) {
        List<Department> all = departments.findAll().stream().sorted(Comparator.comparing(Department::getId)).toList();
        Set<Long> managed = isAdmin() ? all.stream().map(Department::getId).collect(Collectors.toSet()) : authorization.managedUnitIds(user);
        List<AnnouncementOptionsDTO.Target> result = new ArrayList<>();
        if (managed.isEmpty()) return result;
        if (!all.isEmpty() && managed.containsAll(all.stream().map(Department::getId).toList())) {
            result.add(new AnnouncementOptionsDTO.Target(FEDERATION, "Toàn Liên đoàn"));
        }
        for (Department d : all) {
            if (managed.contains(d.getId())) result.add(new AnnouncementOptionsDTO.Target(UNIT + d.getId(), d.getName()));
        }
        return result;
    }

    /** Federation = every active account; a unit = everyone in it and its sub-units. */
    private List<User> recipients(String target) {
        List<User> active = users.findAllActive();
        if (FEDERATION.equals(target)) return active;
        Set<Long> units = authorization.subtreeUnitIds(Long.valueOf(target.substring(UNIT.length())));
        return active.stream().filter(u -> u.getOrgUnit() != null && units.contains(u.getOrgUnit().getId())).toList();
    }
}
