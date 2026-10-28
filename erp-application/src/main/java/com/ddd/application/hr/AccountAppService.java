package com.xxxx.ddd.application.hr;

import com.xxxx.ddd.application.exception.NotFoundException;
import com.xxxx.ddd.application.model.UserDTO;
import com.xxxx.ddd.application.model.command.CreateUserCommand;
import com.xxxx.ddd.application.model.command.UpdateUserCommand;
import com.xxxx.ddd.application.service.audit.AuditAppService;
import com.xxxx.ddd.application.service.user.UserAppService;
import com.xxxx.ddd.application.vldc.CollectionChangedEvent;
import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.Role;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.model.entity.hr.Employee;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.PositionRepository;
import com.xxxx.ddd.domain.respository.RoleRepository;
import com.xxxx.ddd.domain.respository.UserRepository;
import com.xxxx.ddd.domain.respository.hr.EmployeeRepository;
import com.xxxx.ddd.domain.service.UserDomainService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Tài khoản (VLDC): login accounts tied to hồ sơ nhân sự. An account is created from a profile (name, phone, unit
 * come from it) with a one-time random password; roles, chức vụ and lock state go through UserAppService so its
 * admin guards and audit apply. Needs vldc-accounts:create / :update on the whole Liên đoàn; only admin sees or
 * touches admin accounts.
 */
@Service
public class AccountAppService {
    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository users;
    private final UserAppService userApp;
    private final UserDomainService userDomain;
    private final PasswordEncoder passwordEncoder;
    private final EmployeeRepository employees;
    private final DepartmentRepository departments;
    private final RoleRepository roles;
    private final PositionRepository positions;
    private final AuditAppService audit;
    private final ApplicationEventPublisher events;

    public AccountAppService(UserRepository users, UserAppService userApp, UserDomainService userDomain, PasswordEncoder passwordEncoder,
                             EmployeeRepository employees, DepartmentRepository departments, RoleRepository roles,
                             PositionRepository positions, AuditAppService audit, ApplicationEventPublisher events) {
        this.users = users;
        this.userApp = userApp;
        this.userDomain = userDomain;
        this.passwordEncoder = passwordEncoder;
        this.employees = employees;
        this.departments = departments;
        this.roles = roles;
        this.positions = positions;
        this.audit = audit;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public List<AccountDTO> list() {
        HrScope.requireAny(HrScope.ACCOUNTS + ":access");
        boolean admin = isAdminCaller();
        List<User> all = users.search("", 0, 10_000).stream().filter(u -> admin || !isAdminAccount(u)).toList();
        Map<Long, Employee> owners = employees.findByUserIds(all.stream().map(User::getId).toList()).stream()
                .collect(Collectors.toMap(Employee::getUserId, Function.identity()));
        return all.stream().sorted(Comparator.comparing(User::getFullName, Comparator.nullsLast(String::compareTo)))
                .map(u -> toDTO(u, owners.get(u.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public AccountOptionsDTO options() {
        HrScope.requireAny(HrScope.ACCOUNTS + ":access");
        boolean admin = isAdminCaller();
        List<AccountOptionsDTO.Option> roleOptions = roles.findAllActiveWithDetails().stream().filter(r -> admin || !r.isAdmin())
                .sorted(Comparator.comparing(Role::getName)).map(r -> new AccountOptionsDTO.Option(r.getCode(), r.getName())).toList();
        List<AccountOptionsDTO.Option> positionOptions = positions.findAll().stream()
                .map(p -> new AccountOptionsDTO.Option(p.getCode(), p.getName())).toList();
        OrgTree tree = new OrgTree(departments.findAll());
        List<AccountOptionsDTO.Person> people = employees.findAllWithDetails().stream()
                .filter(e -> e.getUserId() == null && !e.hasLeft())
                .map(e -> new AccountOptionsDTO.Person(e.getCode(), e.getFullName(), tree.unitOf(e.getDepartment()).getCode(), e.getTitle(), e.getEmail()))
                .toList();
        return new AccountOptionsDTO(roleOptions, positionOptions, people);
    }

    @Transactional
    public AccountSecretDTO create(CreateAccountCommand command) {
        HrScope.requireAny(HrScope.ACCOUNTS + ":create");
        Employee e = employees.findByCode(command.getEmployeeCode())
                .orElseThrow(() -> new NotFoundException("Không có nhân sự " + command.getEmployeeCode()));
        if (e.hasLeft()) throw new IllegalArgumentException(e.getFullName() + " đã nghỉ việc");
        if (e.getUserId() != null && users.findById(e.getUserId()).filter(u -> !Boolean.TRUE.equals(u.getIsDeleted())).isPresent()) {
            throw new IllegalArgumentException(e.getFullName() + " đã có tài khoản");
        }
        String email = StaffAppService.blankToNull(command.getEmail());
        if (email == null) email = e.getEmail();
        if (email == null) throw new IllegalArgumentException("Cần email cho tài khoản");

        Department unit = new OrgTree(departments.findAll()).unitOf(e.getDepartment());
        String password = temporaryPassword();
        CreateUserCommand create = new CreateUserCommand();
        create.setFullName(e.getFullName());
        create.setUsername(StaffAppService.blankToNull(command.getUsername()));
        create.setEmail(email);
        create.setPhone(e.getPhone());
        create.setPassword(password);
        create.setRoleCodes(command.getRoleCodes());
        create.setPositionCode(StaffAppService.blankToNull(command.getPositionCode()));
        create.setOrgUnitId(unit.getId());
        create.setActive(true);
        UserDTO created = userApp.create(create);

        e.setUserId(created.getId());
        if (e.getEmail() == null) e.setEmail(email);
        employees.save(e);
        audit.record("link-account", AuditAppService.EMPLOYEE, e.getCode(), "user=" + created.getUsername());
        events.publishEvent(new CollectionChangedEvent(StaffAppService.COLLECTION, List.of(e.getCode()), false));
        return new AccountSecretDTO(toDTO(load(created.getId()), e), password);
    }

    @Transactional
    public AccountDTO update(Long id, UpdateAccountCommand command) {
        HrScope.requireAny(HrScope.ACCOUNTS + ":update");
        requireManageable(id);
        Employee owner = employees.findByUserId(id).orElse(null);
        if (Boolean.TRUE.equals(command.getActive()) && owner != null && owner.hasLeft()) {
            throw new IllegalArgumentException(owner.getFullName() + " đã nghỉ việc, không mở lại tài khoản");
        }
        UpdateUserCommand patch = new UpdateUserCommand();
        patch.setRoleCodes(command.getRoleCodes());
        patch.setPositionCode(command.getPositionCode());
        patch.setActive(command.getActive());
        userApp.update(id, patch);
        if (owner != null) events.publishEvent(new CollectionChangedEvent(StaffAppService.COLLECTION, List.of(owner.getCode()), false));
        return toDTO(load(id), owner);
    }

    @Transactional
    public AccountSecretDTO resetPassword(Long id) {
        HrScope.requireAny(HrScope.ACCOUNTS + ":update");
        requireManageable(id);
        String password = temporaryPassword();
        userDomain.changePassword(id, passwordEncoder.encode(password));
        audit.record("reset-password", AuditAppService.USER, id, "VLDC Tài khoản");
        return new AccountSecretDTO(toDTO(load(id), employees.findByUserId(id).orElse(null)), password);
    }

    private User requireManageable(Long id) {
        User user = load(id);
        if (isAdminAccount(user) && !isAdminCaller()) throw new AccessDeniedException("Only admin may modify an admin account");
        return user;
    }

    private User load(Long id) {
        return users.findByIdWithAuth(id).orElseThrow(() -> new NotFoundException("Không có tài khoản " + id));
    }

    private AccountDTO toDTO(User u, Employee owner) {
        AccountDTO dto = new AccountDTO();
        dto.setId(u.getId());
        dto.setUsername(u.getUsername());
        dto.setEmail(u.getEmail());
        dto.setFullName(u.getFullName());
        dto.setActive(!Boolean.FALSE.equals(u.getActive()));
        List<Role> held = u.getRoles() == null ? List.of() : u.getRoles().stream().sorted(Comparator.comparing(Role::getCode)).toList();
        dto.setRoleCodes(held.stream().map(Role::getCode).toList());
        dto.setRoleNames(held.stream().map(Role::getName).toList());
        if (u.getPosition() != null) {
            dto.setPositionCode(u.getPosition().getCode());
            dto.setPositionName(u.getPosition().getName());
        }
        if (u.getOrgUnit() != null) {
            dto.setUnitCode(u.getOrgUnit().getCode());
            dto.setUnitName(u.getOrgUnit().getName());
        }
        if (owner != null) {
            dto.setEmployeeCode(owner.getCode());
            dto.setEmployeeStatus(owner.getStatus());
        }
        dto.setUpdatedAt(u.getUpdatedAt() == null ? null : u.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return dto;
    }

    private static boolean isAdminAccount(User u) {
        return u.getRoles() != null && u.getRoles().stream().anyMatch(Role::isAdmin);
    }

    private static boolean isAdminCaller() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    static String temporaryPassword() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        return sb.toString();
    }
}
