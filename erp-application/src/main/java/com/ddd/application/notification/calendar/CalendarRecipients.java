package com.xxxx.ddd.application.notification.calendar;

import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.Role;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.model.entity.vldc.CalendarEvent;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Stream;

/**
 * Who a calendar entry concerns, mirroring the calendar's own visibility (canSeeScoped in the VLDC engine):
 * federation = everyone; unit = people of that unit (by their đơn vị or their role's phòng ban); personal = the
 * creator's role; project = the creator's role (projects live in the frontend store, so their team is unknown here).
 * The creator's role always gets its own entries.
 */
final class CalendarRecipients {
    private CalendarRecipients() { }

    static List<User> of(CalendarEvent event, List<User> activeUsers) {
        String owner = event.getOwner();
        return activeUsers.stream().filter(user -> switch (event.getScope()) {
            case "federation" -> true;
            case "unit" -> hasRole(user, owner) || inUnit(user, event.getUnit());
            default -> hasRole(user, owner);
        }).toList();
    }

    private static boolean hasRole(User user, String roleCode) {
        return roleCode != null && user.getRoles().stream().anyMatch(r -> roleCode.equalsIgnoreCase(r.getCode()));
    }

    private static boolean inUnit(User user, String unitName) {
        String unit = normalize(unitName);
        if (unit.isEmpty()) return false;
        return Stream.concat(Stream.of(user.getOrgUnit()), user.getRoles().stream().map(Role::getDepartment))
                .filter(Objects::nonNull)
                .map(Department::getName)
                .anyMatch(name -> normalize(name).equals(unit));
    }

    /** "Phòng Kế hoạch – Tài chính" and "Phòng Kế hoạch - Tài chính" are the same unit. */
    static String normalize(String name) {
        if (name == null) return "";
        String n = Normalizer.normalize(name, Normalizer.Form.NFC).toLowerCase(Locale.ROOT);
        return n.replaceAll("[\\u2010-\\u2015\\-]", "-").replaceAll("\\s*-\\s*", " - ").replaceAll("\\s+", " ").trim();
    }
}
