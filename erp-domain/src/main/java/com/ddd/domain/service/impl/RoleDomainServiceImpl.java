package com.xxxx.ddd.domain.service.impl;

import com.xxxx.ddd.domain.model.entity.Permission;
import com.xxxx.ddd.domain.model.entity.Role;
import com.xxxx.ddd.domain.respository.PermissionRepository;
import com.xxxx.ddd.domain.respository.PageActionCatalog;
import com.xxxx.ddd.domain.respository.RoleRepository;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.UserRepository;
import com.xxxx.ddd.domain.service.RoleDomainService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
@Transactional
public class RoleDomainServiceImpl implements RoleDomainService {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private PageActionCatalog pageActionCatalog;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Override
    public Role createRole(Role role, Set<String> permissionCodes) {
        if (role.getName() == null || role.getName().isBlank()) {
            throw new IllegalArgumentException("Role name is required");
        }
        String code = role.getCode();
        if (code == null || code.isBlank()) {
            code = slugify(role.getName());
            role.setCode(code);
        }
        if (roleRepository.existsByCode(role.getCode())) {
            throw new IllegalArgumentException("Role code already exists");
        }
        LocalDateTime now = LocalDateTime.now();
        role.setIsDeleted(false);
        role.setCreatedAt(now);
        role.setUpdatedAt(now);
        role.setPermissions(resolvePermissions(permissionCodes));
        if (role.getDepartment() != null) {
            Long departmentId = role.getDepartment().getId();
            role.setDepartment(departmentId == null || departmentId == 0 ? null : resolveDepartment(departmentId));
        }
        Role saved = roleRepository.save(role);
        log.info("Created role: {}", saved.getCode());
        return roleRepository.findByIdWithDetails(saved.getId()).orElse(saved);
    }

    @Override
    public Role updateRole(Long id, Role patch, Set<String> permissionCodes) {
        Role role = getById(id);
        if (role.isAdmin() && permissionCodes != null) throw new IllegalArgumentException("Admin permissions cannot be reduced");
        if (role.isAdmin() && patch.getCode() != null && !"admin".equalsIgnoreCase(patch.getCode())) {
            throw new IllegalArgumentException("Admin role code cannot be changed");
        }
        if (!role.isAdmin() && "admin".equalsIgnoreCase(patch.getCode())) {
            throw new IllegalArgumentException("Admin role code is reserved");
        }
        if (patch.getName() != null && !patch.getName().isBlank()) {
            role.setName(patch.getName());
        }
        if (patch.getSummary() != null) {
            role.setSummary(patch.getSummary());
        }
        if (patch.getDepartment() != null) {
            Long departmentId = patch.getDepartment().getId();
            role.setDepartment(departmentId == null || departmentId == 0 ? null : resolveDepartment(departmentId));
        }
        if (patch.getCode() != null && !patch.getCode().isBlank() && !patch.getCode().equals(role.getCode())) {
            if (roleRepository.existsByCodeAndIdNot(patch.getCode(), id)) {
                throw new IllegalArgumentException("Role code already exists");
            }
            role.setCode(patch.getCode());
        }
        if (permissionCodes != null) {
            role.setPermissions(resolvePermissions(permissionCodes));
        }
        role.setUpdatedAt(LocalDateTime.now());
        roleRepository.save(role);
        return roleRepository.findByIdWithDetails(id).orElse(role);
    }

    @Override
    public void deleteRole(Long id) {
        Role role = getById(id);
        if (role.isAdmin()) throw new IllegalArgumentException("Admin role cannot be deleted");
        long assigned = userRepository.countByRoleId(id);
        if (assigned > 0) {
            throw new IllegalArgumentException("Cannot delete role that is assigned to users");
        }
        role.setIsDeleted(true);
        role.setDepartment(null);
        role.setUpdatedAt(LocalDateTime.now());
        roleRepository.save(role);
        log.info("Deleted role: {}", role.getCode());
    }

    @Override
    public Role getById(Long id) {
        return roleRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new IllegalArgumentException("Role not found"));
    }

    @Override
    public Role getByCode(String code) {
        return roleRepository.findByCodeWithDetails(code)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + code));
    }

    @Override
    public List<Role> findAll() {
        return roleRepository.findAllActiveWithDetails();
    }

    @Override
    public List<Permission> findAllPermissions() {
        return permissionRepository.findAll();
    }

    @Override
    public Permission createPermission(Permission permission) {
        if (permission.getPage() == null || permission.getAction() == null
                || permission.getPage().getId() == null || permission.getAction().getId() == null) {
            throw new IllegalArgumentException("pageId and actionId are required");
        }
        var page = pageActionCatalog.page(permission.getPage().getId()).orElseThrow(() -> new IllegalArgumentException("Page not found"));
        var action = pageActionCatalog.action(permission.getAction().getId()).orElseThrow(() -> new IllegalArgumentException("Action not found"));
        permission.setPage(page).setAction(action);
        permission.setCode(page.getCode() + ":" + action.getCode());
        permission.setLabel(page.getName() + " - " + action.getName());
        if (permission.getCode() == null || permission.getCode().isBlank()) {
            throw new IllegalArgumentException("Permission code is required");
        }
        if (permission.getLabel() == null || permission.getLabel().isBlank()) {
            throw new IllegalArgumentException("Permission label is required");
        }
        permission.setCode(permission.getCode().trim());
        permission.setLabel(permission.getLabel().trim());
        if (permissionRepository.existsByCode(permission.getCode())) {
            throw new IllegalArgumentException("Permission code already exists");
        }
        Permission saved = permissionRepository.save(permission);
        roleRepository.findByCodeWithDetails("admin").ifPresent(admin -> {
            admin.getPermissions().add(saved);
            roleRepository.save(admin);
        });
        return saved;
    }

    @Override
    public Permission updatePermission(String code, Permission patch) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Permission code is required");
        }
        Permission permission = permissionRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Permission not found: " + code));
        if (patch.getLabel() == null || patch.getLabel().isBlank()) {
            throw new IllegalArgumentException("Permission label is required");
        }
        permission.setLabel(patch.getLabel().trim());
        permission.setNote(patch.getNote());
        return permissionRepository.save(permission);
    }

    @Override
    public void deletePermission(String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Permission code is required");
        }
        Permission permission = permissionRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Permission not found: " + code));
        if (roleRepository.findByCodeWithDetails("admin").map(r -> r.getPermissions().contains(permission)).orElse(false)) {
            throw new IllegalArgumentException("Admin permissions cannot be deleted");
        }
        permissionRepository.deleteRoleLinks(permission.getId());
        permissionRepository.deleteById(permission.getId());
    }

    private Set<Permission> resolvePermissions(Set<String> permissionCodes) {
        if (permissionCodes == null || permissionCodes.isEmpty()) {
            return new HashSet<>();
        }
        List<Permission> found = permissionRepository.findByCodes(permissionCodes);
        if (found.size() != permissionCodes.size()) {
            throw new IllegalArgumentException("One or more permissions were not found");
        }
        return new HashSet<>(found);
    }

    private com.xxxx.ddd.domain.model.entity.Department resolveDepartment(Long id) {
        if (id == null || id <= 0) throw new IllegalArgumentException("Invalid departmentId");
        return departmentRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Department not found"));
    }

    private String slugify(String name) {
        String slug = java.text.Normalizer.normalize(name, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_|_$", "");
        if (slug.isBlank()) {
            slug = "role_" + System.currentTimeMillis();
        }
        return slug.length() > 40 ? slug.substring(0, 40) : slug;
    }
}
