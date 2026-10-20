package com.xxxx.ddd.application.service.role;

import com.xxxx.ddd.application.model.PermissionDTO;
import com.xxxx.ddd.application.model.RoleDTO;
import com.xxxx.ddd.application.model.command.CreatePermissionCommand;
import com.xxxx.ddd.application.model.command.SaveRoleCommand;

import java.util.List;

public interface RoleAppService {
    List<RoleDTO> findAll();

    RoleDTO getById(Long id);

    RoleDTO create(SaveRoleCommand command);

    RoleDTO update(Long id, SaveRoleCommand command);

    void delete(Long id);

    List<PermissionDTO> findAllPermissions();

    PermissionDTO createPermission(CreatePermissionCommand command);

    PermissionDTO updatePermission(String code, CreatePermissionCommand command);

    void deletePermission(String code);
}
