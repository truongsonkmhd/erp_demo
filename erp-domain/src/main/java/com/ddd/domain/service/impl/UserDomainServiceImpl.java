package com.xxxx.ddd.domain.service.impl;

import com.xxxx.ddd.domain.model.auth.FixedRoleLevel;
import com.xxxx.ddd.domain.model.entity.Role;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.PositionRepository;
import com.xxxx.ddd.domain.respository.RoleRepository;
import com.xxxx.ddd.domain.respository.UserRepository;
import com.xxxx.ddd.domain.service.UserDomainService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
public class UserDomainServiceImpl implements UserDomainService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PositionRepository positionRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public User createUser(User user, List<String> roleCodes, String levelCode, String positionCode, Long orgUnitId) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        String email = user.getEmail().trim();
        user.setEmail(email);

        if (user.getUsername() == null || user.getUsername().isBlank()) {
            user.setUsername(generateUniqueUsername(email));
        } else {
            user.setUsername(user.getUsername().trim());
            if (userRepository.existsByUsername(user.getUsername())) {
                throw new IllegalArgumentException("Username already exists");
            }
        }

        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (user.getFullName() == null || user.getFullName().isBlank()) {
            throw new IllegalArgumentException("Full name is required");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        assignRoleAndLevel(user, roleCodes, levelCode);
        assignOrg(user, positionCode, orgUnitId);
        validateAccountType(user.getAccountType());
        LocalDateTime now = LocalDateTime.now();
        user.setActive(user.getActive() == null ? Boolean.TRUE : user.getActive());
        user.setIsDeleted(false);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        User saved = userRepository.save(user);
        log.info("Created user: {} ({})", saved.getUsername(), saved.getEmail());
        return userRepository.findByIdWithAuth(saved.getId()).orElse(saved);
    }

    private String generateUniqueUsername(String email) {
        String local = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
        String base = local.replaceAll("[^a-zA-Z0-9._-]", "").toLowerCase();
        if (base.isBlank()) {
            base = "user";
        }
        if (!userRepository.existsByUsername(base)) {
            return base;
        }
        for (int i = 1; i < 1000; i++) {
            String candidate = base + i;
            if (!userRepository.existsByUsername(candidate)) {
                return candidate;
            }
        }
        String fallback = email.toLowerCase().replaceAll("[^a-zA-Z0-9]", "_");
        if (!userRepository.existsByUsername(fallback)) {
            return fallback;
        }
        return fallback + "_" + System.currentTimeMillis();
    }

    @Override
    @Transactional
    public User updateUser(Long id, User patch, List<String> roleCodes, String levelCode, String positionCode, Long orgUnitId) {
        User user = getById(id);
        if (patch.getFullName() != null && !patch.getFullName().isBlank()) {
            user.setFullName(patch.getFullName());
        }
        if (patch.getEmail() != null && !patch.getEmail().isBlank()) {
            if (userRepository.existsByEmailAndIdNot(patch.getEmail(), id)) {
                throw new IllegalArgumentException("Email already exists");
            }
            user.setEmail(patch.getEmail());
        }
        if (patch.getUsername() != null && !patch.getUsername().isBlank()) {
            if (userRepository.existsByUsernameAndIdNot(patch.getUsername(), id)) {
                throw new IllegalArgumentException("Username already exists");
            }
            user.setUsername(patch.getUsername());
        }
        if (patch.getPhone() != null) {
            user.setPhone(patch.getPhone());
        }
        if (patch.getBaseSalary() != null) {
            user.setBaseSalary(patch.getBaseSalary());
        }
        if (Boolean.TRUE.equals(patch.getActive()) && user.isPendingRegistration()) {
            throw new IllegalArgumentException("Account is waiting for approval; approve it instead of activating it");
        }
        if (patch.getActive() != null) {
            if (!patch.getActive() && user.getRoles().stream().anyMatch(Role::isAdmin)) {
                Role admin = user.getRoles().stream().filter(Role::isAdmin).findFirst().orElseThrow();
                if (userRepository.countActiveByRoleId(admin.getId()) <= 1) throw new IllegalArgumentException("Cannot deactivate the last admin");
            }
            user.setActive(patch.getActive());
        }
        if (patch.getAccountType() != null) {
            validateAccountType(patch.getAccountType());
            user.setAccountType(patch.getAccountType());
        }
        if (roleCodes != null && user.getRoles().stream().anyMatch(Role::isAdmin)
                && roleCodes.stream().noneMatch(code -> "admin".equalsIgnoreCase(code))) {
            Role admin = user.getRoles().stream().filter(Role::isAdmin).findFirst().orElseThrow();
            if (userRepository.countActiveByRoleId(admin.getId()) <= 1) throw new IllegalArgumentException("Cannot remove the last admin role");
        }
        if (roleCodes != null || levelCode != null) {
            List<String> nextRole = roleCodes != null ? roleCodes : user.getRoles().stream().map(Role::getCode).toList();
            String nextLevel = levelCode != null ? levelCode : user.getLevelCode();
            assignRoleAndLevel(user, nextRole, nextLevel);
        }
        assignOrg(user, positionCode, orgUnitId);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        return userRepository.findByIdWithAuth(id).orElse(user);
    }

    @Override
    @Transactional
    public User register(User user, Long requestedOrgUnitId) {
        if (user.getFullName() == null || user.getFullName().isBlank()) {
            throw new IllegalArgumentException("Full name is required");
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        String email = user.getEmail().trim();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        user.setEmail(email);
        user.setFullName(user.getFullName().trim());
        user.setUsername(generateUniqueUsername(email));
        // Nothing the client sends decides access: no role, no chức vụ, no đơn vị until an admin approves.
        user.setRoles(new java.util.HashSet<>());
        user.setPosition(null);
        user.setOrgUnit(null);
        user.setLevelCode(null);
        user.setAccountType(2);
        user.setRequestedOrgUnit(requestedOrgUnitId == null ? null : departmentRepository.findById(requestedOrgUnitId)
                .orElseThrow(() -> new IllegalArgumentException("Department not found: " + requestedOrgUnitId)));
        user.setRegistrationStatus(User.REGISTRATION_PENDING);
        user.setActive(false);
        user.setIsDeleted(false);
        LocalDateTime now = LocalDateTime.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        User saved = userRepository.save(user);
        log.info("Registered user pending approval: {} ({})", saved.getUsername(), saved.getEmail());
        return saved;
    }

    @Override
    @Transactional
    public User approveRegistration(Long id, List<String> roleCodes, String levelCode, String positionCode, Long orgUnitId) {
        User user = requirePending(id);
        if (roleCodes != null && roleCodes.stream().anyMatch(code -> "admin".equalsIgnoreCase(code))) {
            throw new IllegalArgumentException("A self-registered account cannot be approved as admin");
        }
        assignRoleAndLevel(user, roleCodes, levelCode);
        Long unitId = orgUnitId != null ? orgUnitId : user.getRequestedOrgUnit() == null ? null : user.getRequestedOrgUnit().getId();
        assignOrg(user, positionCode, unitId);
        user.setRegistrationStatus(User.REGISTRATION_APPROVED);
        user.setActive(true);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        return userRepository.findByIdWithAuth(id).orElse(user);
    }

    @Override
    @Transactional
    public User rejectRegistration(Long id) {
        User user = requirePending(id);
        user.setRegistrationStatus(User.REGISTRATION_REJECTED);
        userRepository.save(user);
        deactivate(id);
        return user;
    }

    private User requirePending(Long id) {
        User user = getById(id);
        if (!user.isPendingRegistration()) {
            throw new IllegalArgumentException("Account is not waiting for approval");
        }
        return user;
    }

    @Override
    @Transactional(readOnly = true)
    public User getById(Long id) {
        return userRepository.findByIdWithAuth(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public User getByUsernameOrEmail(String login) {
        return userRepository.findByUsernameOrEmailWithAuth(login)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
    }

    @Override
    @Transactional(readOnly = true)
    public User getByEmail(String email) {
        return userRepository.findByEmailWithAuth(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> search(String keyword, String registrationStatus, int pageNo, int pageSize) {
        int page = Math.max(pageNo, 1);
        int size = pageSize <= 0 ? 10 : pageSize;
        int offset = (page - 1) * size;
        return userRepository.search(keyword, registrationStatus, offset, size);
    }

    @Override
    public long countSearch(String keyword, String registrationStatus) {
        return userRepository.countSearch(keyword, registrationStatus);
    }

    @Override
    @Transactional
    public void changePassword(Long id, String encodedPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPassword(encodedPassword);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        User user = getById(id);
        if (user.getRoles().stream().anyMatch(Role::isAdmin) && userRepository.countActiveByRoleId(
                user.getRoles().stream().filter(Role::isAdmin).findFirst().orElseThrow().getId()) <= 1) {
            throw new IllegalArgumentException("Cannot delete the last admin");
        }
        user.setActive(false);
        user.setIsDeleted(true);
        // Free unique keys so the same email/username can be reused after soft-delete.
        String suffix = "_deleted_" + id + "_" + System.currentTimeMillis();
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            String nextUsername = user.getUsername() + suffix;
            user.setUsername(nextUsername.length() > 100 ? nextUsername.substring(0, 100) : nextUsername);
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            String nextEmail = user.getEmail() + suffix;
            user.setEmail(nextEmail.length() > 255 ? nextEmail.substring(0, 255) : nextEmail);
        }
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("Deactivated user id={}", id);
    }

    private void assignRoleAndLevel(User user, List<String> roleCodes, String levelCode) {
        if (roleCodes == null || roleCodes.isEmpty()) {
            throw new IllegalArgumentException("Role is required");
        }
        java.util.Set<Role> roles = new java.util.HashSet<>();
        for (String roleCode : roleCodes) {
            Role role = roleRepository.findByCodeWithDetails(roleCode)
                    .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleCode));
            if (Boolean.TRUE.equals(role.getIsDeleted())) {
                throw new IllegalArgumentException("Role is deleted: " + roleCode);
            }
            roles.add(role);
        }
        user.setRoles(roles);
        if (roles.stream().allMatch(Role::hasNoLevels)) {
            user.setLevelCode(null);
            return;
        }
        String resolvedLevel = (levelCode == null || levelCode.isBlank())
                ? FixedRoleLevel.defaultCode()
                : FixedRoleLevel.require(levelCode).getCode();
        user.setLevelCode(resolvedLevel);
    }

    private void assignOrg(User user, String positionCode, Long orgUnitId) {
        if (positionCode != null) {
            user.setPosition(positionCode.isBlank() ? null : positionRepository.findByCode(positionCode.trim())
                    .orElseThrow(() -> new IllegalArgumentException("Position not found: " + positionCode)));
        }
        if (orgUnitId != null) {
            user.setOrgUnit(orgUnitId <= 0 ? null : departmentRepository.findById(orgUnitId)
                    .orElseThrow(() -> new IllegalArgumentException("Department not found: " + orgUnitId)));
        }
    }

    private void validateAccountType(Integer type) {
        if (type == null || type < 1 || type > 3) throw new IllegalArgumentException("accountType must be 1, 2 or 3");
    }

}
