package com.xxxx.ddd.application.service.role.impl;

import com.xxxx.ddd.application.mapper.AuthMapper;
import com.xxxx.ddd.application.model.PermissionDTO;
import com.xxxx.ddd.application.model.RoleDTO;
import com.xxxx.ddd.application.model.command.CreatePermissionCommand;
import com.xxxx.ddd.application.model.command.SaveRoleCommand;
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
        Role updated = roleDomainService.updateRole(id, patch, toSet(command.getPermissionIds()));
        return AuthMapper.toRoleDTO(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        roleDomainService.deleteRole(id);
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
        return AuthMapper.toPermissionDTO(roleDomainService.createPermission(permission));
    }

    @Override
    @Transactional
    public PermissionDTO updatePermission(String code, CreatePermissionCommand command) {
        Permission permission = new Permission()
                .setLabel(command.getLabel())
                .setNote(command.getNote());
        return AuthMapper.toPermissionDTO(roleDomainService.updatePermission(code, permission));
    }

    @Override
    @Transactional
    public void deletePermission(String code) {
        roleDomainService.deletePermission(code);
    }

    private Set<String> toSet(List<String> values) {
        return values == null ? null : new HashSet<>(values);
    }
}
