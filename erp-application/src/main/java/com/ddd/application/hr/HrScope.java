package com.xxxx.ddd.application.hr;

import com.xxxx.ddd.application.service.security.CurrentActor;
import com.xxxx.ddd.domain.service.AuthorizationService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Who may change HR and organisation data, and where. The ":create" permission of a page means working on the whole
 * Liên đoàn (Lãnh đạo, Phòng TC-HC); ":update" alone means only inside the units the actor manages (đặc tả 6.3,
 * AuthorizationService.managedUnitIds, which covers the unit's tổ/phòng too). Admin may do everything.
 */
@Component
public class HrScope {
    public static final String HR = "vldc-hr";
    public static final String ORG = "vldc-organization";
    public static final String ACCOUNTS = "vldc-accounts";

    private final CurrentActor currentActor;
    private final AuthorizationService authorization;

    public HrScope(CurrentActor currentActor, AuthorizationService authorization) {
        this.currentActor = currentActor;
        this.authorization = authorization;
    }

    public static boolean has(String authority) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()) || authority.equals(a.getAuthority()));
    }

    /** May work on every unit of the page's data. */
    public boolean wholeOrg(String page) {
        return has(page + ":create");
    }

    /** May change the page's data inside this unit or tổ (a department id). */
    public boolean canChange(String page, Long departmentId) {
        if (wholeOrg(page)) return true;
        if (!has(page + ":update") || departmentId == null) return false;
        return managed().contains(departmentId);
    }

    public void requireChange(String page, Long departmentId) {
        if (!canChange(page, departmentId)) throw new AccessDeniedException("Ngoài phạm vi quản lý");
    }

    public void requireWholeOrg(String page) {
        if (!wholeOrg(page)) throw new AccessDeniedException("Cần quyền trên toàn Liên đoàn");
    }

    /** The authority (or admin), whatever the unit. */
    public static void requireAny(String authority) {
        if (!has(authority)) throw new AccessDeniedException("Missing " + authority);
    }

    private Set<Long> managed() {
        return authorization.managedUnitIds(currentActor.require());
    }
}
