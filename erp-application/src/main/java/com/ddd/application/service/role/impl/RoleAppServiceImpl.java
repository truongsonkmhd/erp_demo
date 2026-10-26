package com.xxxx.ddd.application.service.role.impl;

import com.xxxx.ddd.application.mapper.AuthMapper;
import com.xxxx.ddd.application.model.PermissionDTO;
import com.xxxx.ddd.application.model.RoleDTO;
import com.xxxx.ddd.application.model.command.CreatePermissionCommand;
import com.xxxx.ddd.application.model.command.SaveRoleCommand;
import com.xxxx.ddd.application.service.audit.AuditAppService;
import com.xxxx.ddd.application.service.role.RoleAppService;
import com.xxxx.ddd.domain.model.entity.Permission;
import com.xxxx.ddd.domain.model.entity.Role;
import com.xxxx.ddd.domain.service.RoleDomainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class RoleAppServiceImpl implements RoleAppService {

    @Autowired
    private RoleDomainService roleDomainService;

    @Autowired
    private AuditAppService audit;

    @Override
    @Transactional(readOnly = true)
    public List<RoleDTO> findAll() {
        return roleDomainService.findAll().stream().map(AuthMapper::toRoleDTO).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RoleDTO getById(Long id) {
        return AuthMapper.toRoleDTO(roleDomainService.getById(id));
    }

    @Override
    @Transactional
    public RoleDTO create(SaveRoleCommand command) {
        Role role = new Role()
                .setCode(command.getCode())
                .setName(command.getName())
                .setSummary(command.getSummary());
        if (command.getDepartmentId() != null) role.setDepartment(new com.xxxx.ddd.domain.model.entity.Department().setId(command.getDepartmentId()));
        Role saved = roleDomainService.createRole(role, toSet(command.getPermissionIds()));
        audit.record("create", AuditAppService.ROLE, saved.getCode(), "permissions=" + permissionCodes(saved));
        return AuthMapper.toRoleDTO(saved);
    }

    @Override
    @Transactional
    public RoleDTO update(Long id, SaveRoleCommand command) {
        Role patch = new Role()
                .setCode(command.getCode())
                .setName(command.getName())
                .setSummary(command.getSummary());
        if (command.getDepartmentId() != null) patch.setDepartment(new com.xxxx.ddd.domain.model.entity.Department().setId(command.getDepartmentId()));
        List<String> before = permissionCodes(roleDomainService.getById(id));
        Role updated = roleDomainService.updateRole(id, patch, toSet(command.getPermissionIds()));
        List<String> after = permissionCodes(updated);
        audit.record("update", AuditAppService.ROLE, updated.getCode(), before.equals(after) ? null : "permissions " + before + " -> " + after);
        return AuthMapper.toRoleDTO(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        String code = roleDomainService.getById(id).getCode();
        roleDomainService.deleteRole(id);
        audit.record("delete", AuditAppService.ROLE, code, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PermissionDTO> findAllPermissions() {
        return roleDomainService.findAllPermissions().stream().map(AuthMapper::toPermissionDTO).toList();
    }

    @Override
    @Transactional
    public PermissionDTO createPermission(CreatePermissionCommand command) {
        Permission permission = new Permission()
                .setCode(command.getId())
                .setLabel(command.getLabel())
                .setNote(command.getNote());
        if (command.getPageId() != null) {
            var page = new com.xxxx.ddd.domain.model.entity.Page();
            page.setId(command.getPageId());
            permission.setPage(page);
        }
        if (command.getActionId() != null) {
            var action = new com.xxxx.ddd.domain.model.entity.Action();
            action.setId(command.getActionId());
            permission.setAction(action);
        }
        PermissionDTO created = AuthMapper.toPermissionDTO(roleDomainService.createPermission(permission));
        audit.record("create", AuditAppService.PERMISSION, created.getCode(), null);
        return created;
    }

    @Override
    @Transactional
    public PermissionDTO updatePermission(String code, CreatePermissionCommand command) {
        Permission permission = new Permission()
                .setLabel(command.getLabel())
                .setNote(command.getNote());
        PermissionDTO updated = AuthMapper.toPermissionDTO(roleDomainService.updatePermission(code, permission));
        audit.record("update", AuditAppService.PERMISSION, code, null);
        return updated;
    }

    @Override
    @Transactional
    public void deletePermission(String code) {
        roleDomainService.deletePermission(code);
        audit.record("delete", AuditAppService.PERMISSION, code, null);
    }

    private List<String> permissionCodes(Role role) {
        return role.getPermissions() == null ? List.of() : role.getPermissions().stream().map(Permission::getCode).sorted().toList();
    }

    private Set<String> toSet(List<String> values) {
        return values == null ? null : new HashSet<>(values);
    }
}
