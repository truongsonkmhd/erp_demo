package com.xxxx.ddd.domain.service;

import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Phạm vi nghiệp vụ dùng chung (đặc tả mục 6.3): Permission cho biết được làm chức năng nào, còn hàm này cho biết
 * được làm với ai. Một người quản lý đơn vị mình và các đơn vị con khi chức vụ có managesUnit, và chỉ quản lý người
 * có cấp bậc thấp hơn (level lớn hơn). Cấp bậc một mình không đủ: luôn kiểm tra cả quan hệ đơn vị.
 */
@Service
@Transactional(readOnly = true)
public class AuthorizationService {
    private final DepartmentRepository departments;
    private final UserRepository users;

    public AuthorizationService(DepartmentRepository departments, UserRepository users) {
        this.departments = departments;
        this.users = users;
    }

    /** Ids of the unit and every unit below it. */
    public Set<Long> subtreeUnitIds(Long unitId) {
        if (unitId == null) return Set.of();
        Map<Long, List<Long>> children = new HashMap<>();
        for (Department d : departments.findAll()) {
            if (d.getParentId() != null) children.computeIfAbsent(d.getParentId(), k -> new ArrayList<>()).add(d.getId());
        }
        Set<Long> result = new LinkedHashSet<>();
        Deque<Long> queue = new ArrayDeque<>(List.of(unitId));
        while (!queue.isEmpty()) {
            Long id = queue.poll();
            if (result.add(id)) queue.addAll(children.getOrDefault(id, List.of()));
        }
        return result;
    }

    /** Units whose data and people the user manages; empty for a position that does not manage a unit. */
    public Set<Long> managedUnitIds(User user) {
        if (user == null || user.getOrgUnit() == null || user.getPosition() == null
                || !Boolean.TRUE.equals(user.getPosition().getManagesUnit())) {
            return Set.of();
        }
        return subtreeUnitIds(user.getOrgUnit().getId());
    }

    /** Actor may assign work/KPI to target: target sits in a unit the actor manages and ranks below the actor. */
    public boolean canManage(User actor, User target) {
        return canManage(actor, target, managedUnitIds(actor));
    }

    /** People the actor may assign work/KPI to. */
    public List<User> manageableUsers(User actor) {
        Set<Long> managed = managedUnitIds(actor);
        if (managed.isEmpty()) return List.of();
        return users.findAllActive().stream().filter(u -> canManage(actor, u, managed)).toList();
    }

    private boolean canManage(User actor, User target, Set<Long> managed) {
        if (actor == null || target == null || Objects.equals(actor.getId(), target.getId())) return false;
        if (Boolean.FALSE.equals(target.getActive()) || Boolean.TRUE.equals(target.getIsDeleted())) return false;
        if (target.getOrgUnit() == null || !managed.contains(target.getOrgUnit().getId())) return false;
        Integer actorLevel = actor.getPosition() == null ? null : actor.getPosition().getLevel();
        Integer targetLevel = target.getPosition() == null ? null : target.getPosition().getLevel();
        return actorLevel != null && targetLevel != null && actorLevel < targetLevel;
    }
}
