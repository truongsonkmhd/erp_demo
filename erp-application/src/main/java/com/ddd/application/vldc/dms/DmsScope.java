package com.xxxx.ddd.application.vldc.dms;

import com.xxxx.ddd.application.service.security.CurrentActor;
import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.Role;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.service.AuthorizationService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Who may do what in the DMS, always from the user reloaded from the database (never from the client):
 * Ban lãnh đạo, P. Kỹ thuật and P. KH-TC see every project, other units their own (same as canSeeProject in org.ts);
 * whoever sees a project may upload, create folders, copy and move inside it; deleting is for the creator, the head of
 * the unit owning the project, and admin.
 */
@Component
public class DmsScope {
    /** Units that follow every project. */
    static final Set<String> SEES_ALL_PROJECTS = Set.of("BLD", "KT", "KHTC");

    private final CurrentActor actor;
    private final AuthorizationService authorization;
    private final DepartmentRepository departments;

    public DmsScope(CurrentActor actor, AuthorizationService authorization, DepartmentRepository departments) {
        this.actor = actor;
        this.authorization = authorization;
        this.departments = departments;
    }

    public record Caller(String username, String name, boolean admin, boolean seesAll, Set<String> units, Set<String> managedUnits) {
        public boolean canSee(String unit) {
            return admin || seesAll || units.contains(unit);
        }

        public boolean canDelete(String unit, String createdBy) {
            return admin || (createdBy != null && createdBy.equals(username)) || managedUnits.contains(unit);
        }

        public void requireSee(String unit) {
            if (!canSee(unit)) throw new AccessDeniedException("Ngoài phạm vi dự án của bạn");
        }

        public void requireDelete(String unit, String createdBy) {
            if (!canDelete(unit, createdBy)) throw new AccessDeniedException("Chỉ người tạo, trưởng đơn vị hoặc admin được xóa");
        }
    }

    public Caller current() {
        User user = actor.require();
        Map<Long, String> codes = departments.findAll().stream()
                .filter(d -> d.getCode() != null)
                .collect(Collectors.toMap(Department::getId, Department::getCode));
        Set<String> managed = authorization.managedUnitIds(user).stream().map(codes::get).filter(Objects::nonNull).collect(Collectors.toSet());
        String own = user.getOrgUnit() == null ? null : codes.get(user.getOrgUnit().getId());
        Set<String> units = new HashSet<>(managed);
        if (own != null) units.add(own);
        boolean admin = user.getRoles().stream().anyMatch(Role::isAdmin);
        String name = user.getFullName() == null || user.getFullName().isBlank() ? user.getUsername() : user.getFullName();
        return new Caller(user.getUsername(), name, admin, own != null && SEES_ALL_PROJECTS.contains(own), Set.copyOf(units), Set.copyOf(managed));
    }

    /** Unit codes that exist (a project folder tree may only be owned by one of them). */
    public boolean isUnit(String code) {
        return departments.findAll().stream().anyMatch(d -> code != null && code.equals(d.getCode()));
    }
}
