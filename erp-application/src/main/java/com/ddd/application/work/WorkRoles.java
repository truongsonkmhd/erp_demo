package com.xxxx.ddd.application.work;

import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.UserRepository;
import com.xxxx.ddd.domain.service.AuthorizationService;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Vai trò nghiệp vụ của một người trong dự án / việc / nhiệm vụ, tính từ đơn vị và chức vụ trong DB (không tin dữ liệu
 * frontend gửi): Phòng Kỹ thuật lập dự án và giao việc, Liên đoàn trưởng duyệt dự án, trưởng đơn vị tách việc con và
 * duyệt nhiệm vụ của người trong đơn vị.
 */
@Component
public class WorkRoles {
    /** Đơn vị lập dự án và giao việc. */
    public static final String TECHNICAL_DEPARTMENT = "KT";
    /** Đơn vị gốc (Ban Lãnh đạo Liên đoàn). */
    public static final String ROOT_DEPARTMENT = "BLD";

    private final UserRepository users;
    private final DepartmentRepository departments;
    private final AuthorizationService authorization;

    public WorkRoles(UserRepository users, DepartmentRepository departments, AuthorizationService authorization) {
        this.users = users;
        this.departments = departments;
        this.authorization = authorization;
    }

    /** Người thuộc Phòng Kỹ thuật. */
    public boolean isTechnicalDept(User user) {
        return user != null && user.getOrgUnit() != null && TECHNICAL_DEPARTMENT.equals(user.getOrgUnit().getCode());
    }

    /** Người quản lý toàn Liên đoàn (duyệt dự án, quyết xoá dự án). */
    public boolean isFederationHead(User user) {
        return rootDepartment().map(root -> authorization.managedUnitIds(user).contains(root.getId())).orElse(false);
    }

    /** Người có chức vụ quản lý đơn vị. */
    public boolean isUnitHead(User user) {
        return user != null && user.getPosition() != null && Boolean.TRUE.equals(user.getPosition().getManagesUnit());
    }

    /** Liên đoàn trưởng: người quản lý toàn Liên đoàn có cấp bậc cao nhất. */
    public Optional<User> federationHead() {
        return users.findAllActive().stream().filter(this::isFederationHead).min(byLevel());
    }

    /**
     * Trưởng đơn vị của một đơn vị: người quản lý đơn vị có cấp bậc cao nhất; đơn vị không có trưởng thì lấy trưởng của
     * đơn vị cha.
     */
    public Optional<User> unitHeadOf(Long departmentId) {
        Map<Long, Department> byId = departments.findAll().stream().collect(Collectors.toMap(Department::getId, Function.identity()));
        List<User> heads = users.findAllActive().stream().filter(this::isUnitHead).toList();
        Long current = departmentId;
        while (current != null) {
            Long unit = current;
            Optional<User> head = heads.stream()
                    .filter(u -> u.getOrgUnit() != null && Objects.equals(u.getOrgUnit().getId(), unit))
                    .min(byLevel());
            if (head.isPresent()) return head;
            Department d = byId.get(current);
            current = d == null ? null : d.getParentId();
        }
        return Optional.empty();
    }

    /**
     * Cấp trên trực tiếp (người duyệt nhiệm vụ): trưởng đơn vị của người đó; trưởng đơn vị thì là Liên đoàn trưởng;
     * Liên đoàn trưởng không có cấp trên.
     */
    public Optional<User> directSuperior(User user) {
        if (user == null || isFederationHead(user)) return Optional.empty();
        if (isUnitHead(user) || user.getOrgUnit() == null) return federationHead();
        return unitHeadOf(user.getOrgUnit().getId())
                .filter(head -> !Objects.equals(head.getId(), user.getId()))
                .or(this::federationHead);
    }

    private Optional<Department> rootDepartment() {
        return departments.findAll().stream().filter(d -> ROOT_DEPARTMENT.equals(d.getCode())).findFirst();
    }

    /** Lower level = higher rank; people without a position come last. */
    private static Comparator<User> byLevel() {
        return Comparator.comparing((User u) -> u.getPosition() == null || u.getPosition().getLevel() == null
                ? Integer.MAX_VALUE : u.getPosition().getLevel()).thenComparing(User::getId);
    }
}
