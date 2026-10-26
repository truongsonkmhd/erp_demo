package com.xxxx.ddd.domain.service;

import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.Position;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.UserRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class AuthorizationServiceTest {
    private static final Position LEADER = new Position().setId(1L).setCode("LANH_DAO").setLevel(1).setManagesUnit(true);
    private static final Position HEAD = new Position().setId(2L).setCode("TRUONG_DON_VI").setLevel(2).setManagesUnit(true);
    private static final Position STAFF = new Position().setId(3L).setCode("NHAN_VIEN").setLevel(3).setManagesUnit(false);

    // BLD (root) -> MD -> MD-T1 ; BLD -> DB
    private final Department bld = new Department().setId(1L).setCode("BLD");
    private final Department md = new Department().setId(2L).setCode("MD").setParentId(1L);
    private final Department mdTeam = new Department().setId(3L).setCode("MD-T1").setParentId(2L);
    private final Department db = new Department().setId(4L).setCode("DB").setParentId(1L);

    private final User leader = user(1, LEADER, bld);
    private final User mdHead = user(2, HEAD, md);
    private final User mdStaff = user(3, STAFF, md);
    private final User teamStaff = user(4, STAFF, mdTeam);
    private final User dbHead = user(5, HEAD, db);
    private final User dbStaff = user(6, STAFF, db);
    private final User otherMdHead = user(7, HEAD, md);

    private final AuthorizationService service = new AuthorizationService(
            repo(DepartmentRepository.class, List.of(bld, md, mdTeam, db)),
            repo(UserRepository.class, List.of(leader, mdHead, mdStaff, teamStaff, dbHead, dbStaff, otherMdHead)));

    @Test
    void subtreeIncludesNestedUnits() {
        assertEquals(Set.of(2L, 3L), service.subtreeUnitIds(2L));
        assertEquals(Set.of(1L, 2L, 3L, 4L), service.subtreeUnitIds(1L));
    }

    @Test
    void leaderManagesEveryoneBelow() {
        assertEquals(List.of(mdHead, mdStaff, teamStaff, dbHead, dbStaff, otherMdHead), service.manageableUsers(leader));
    }

    @Test
    void headManagesLowerRanksInOwnUnitAndSubUnits() {
        assertTrue(service.canManage(mdHead, mdStaff));
        assertTrue(service.canManage(mdHead, teamStaff));
    }

    @Test
    void headCannotReachOtherUnitsOrPeers() {
        assertFalse(service.canManage(mdHead, dbStaff), "another unit");
        assertFalse(service.canManage(mdHead, otherMdHead), "same level in the same unit");
        assertFalse(service.canManage(mdHead, leader), "a higher rank");
        assertFalse(service.canManage(mdHead, mdHead), "oneself");
    }

    @Test
    void staffManagesNobody() {
        assertTrue(service.managedUnitIds(mdStaff).isEmpty());
        assertTrue(service.manageableUsers(mdStaff).isEmpty());
    }

    @Test
    void missingPositionOrUnitGrantsNothing() {
        User noPosition = user(8, null, md);
        User noUnit = user(9, STAFF, null);
        assertFalse(service.canManage(mdHead, noPosition));
        assertFalse(service.canManage(mdHead, noUnit));
        assertTrue(service.manageableUsers(noPosition).isEmpty());
    }

    @Test
    void inactiveUsersAreNotAssignable() {
        mdStaff.setActive(false);
        assertFalse(service.canManage(mdHead, mdStaff));
    }

    private static User user(long id, Position position, Department unit) {
        return new User().setId(id).setPosition(position).setOrgUnit(unit).setActive(true).setIsDeleted(false);
    }

    /** Repository stub answering findAll / findAllActive with the given list. */
    @SuppressWarnings("unchecked")
    private static <T> T repo(Class<T> type, List<?> rows) {
        return (T) Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (proxy, method, args) -> switch (method.getName()) {
            case "findAll", "findAllActive" -> rows;
            case "findById" -> Optional.empty();
            default -> throw new UnsupportedOperationException(method.getName());
        });
    }
}
