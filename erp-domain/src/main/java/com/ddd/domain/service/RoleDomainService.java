package com.xxxx.ddd.domain.service;

import com.xxxx.ddd.domain.model.entity.Permission;
import com.xxxx.ddd.domain.model.entity.Role;

import java.util.List;
import java.util.Set;

public interface RoleDomainService {
    Role createRole(Role role, Set<String> permissionCodes);

    Role updateRole(Long id, Role patch, Set<String> permissionCodes);

    void deleteRole(Long id);

    Role getById(Long id);

    Role getByCode(String code);

    List<Role> findAll();

    List<Permission> findAllPermissions();

    Permission createPermission(Permission permission);

    Permission updatePermission(String code, Permission patch);

    void deletePermission(String code);
}
