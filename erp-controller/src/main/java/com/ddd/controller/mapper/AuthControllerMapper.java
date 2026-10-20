package com.xxxx.ddd.controller.mapper;

import com.xxxx.ddd.application.model.command.AuthenticateCommand;
import com.xxxx.ddd.application.model.command.ChangePasswordCommand;
import com.xxxx.ddd.application.model.command.CreatePermissionCommand;
import com.xxxx.ddd.application.model.command.CreateUserCommand;
import com.xxxx.ddd.application.model.command.SaveRoleCommand;
import com.xxxx.ddd.application.model.command.UpdateUserCommand;
import com.xxxx.ddd.controller.dto.AuthenticateRequest;
import com.xxxx.ddd.controller.dto.ChangePasswordRequest;
import com.xxxx.ddd.controller.dto.CreatePermissionRequest;
import com.xxxx.ddd.controller.dto.CreateUserRequest;
import com.xxxx.ddd.controller.dto.PermissionItemRequest;
import com.xxxx.ddd.controller.dto.SaveRoleRequest;
import com.xxxx.ddd.controller.dto.UpdatePermissionRequest;
import com.xxxx.ddd.controller.dto.UpdateUserRequest;

import java.util.List;

public class AuthControllerMapper {

    private AuthControllerMapper() {
    }

    public static AuthenticateCommand toCommand(AuthenticateRequest request) {
        AuthenticateCommand command = new AuthenticateCommand();
        command.setEmail(request.getEmail());
        command.setPassword(request.getPassword());
        command.setIsRememberMe(request.getIsRememberMe());
        return command;
    }

    public static CreateUserCommand toCommand(CreateUserRequest request) {
        CreateUserCommand command = new CreateUserCommand();
        command.setFullName(request.getFullName());
        command.setUsername(request.getUsername());
        command.setPassword(request.getPassword());
        command.setEmail(request.getEmail());
        command.setPhone(request.getPhone());
        command.setRoleCode(request.getRoleCode());
        command.setRoleCodes(request.getRoleCodes());
        command.setAccountType(request.getAccountType());
        command.setLevelId(request.getLevelId());
        command.setBaseSalary(request.getBaseSalary());
        command.setActive(request.getActive());
        return command;
    }

    public static UpdateUserCommand toCommand(UpdateUserRequest request) {
        UpdateUserCommand command = new UpdateUserCommand();
        command.setFullName(request.getFullName());
        command.setUsername(request.getUsername());
        command.setEmail(request.getEmail());
        command.setPhone(request.getPhone());
        command.setRoleCode(request.getRoleCode());
        command.setRoleCodes(request.getRoleCodes());
        command.setAccountType(request.getAccountType());
        command.setLevelId(request.getLevelId());
        command.setBaseSalary(request.getBaseSalary());
        command.setActive(request.getActive());
        return command;
    }

    public static ChangePasswordCommand toCommand(ChangePasswordRequest request) {
        ChangePasswordCommand command = new ChangePasswordCommand();
        command.setId(request.getId());
        command.setPassword(request.getPassword());
        command.setConfirmPassword(request.getConfirmPassword());
        return command;
    }

    public static SaveRoleCommand toCommand(SaveRoleRequest request) {
        SaveRoleCommand command = new SaveRoleCommand();
        command.setCode(request.getCode());
        command.setName(request.getName());
        command.setSummary(request.getSummary());
        command.setDepartmentId(request.getDepartmentId());
        if (request.getPermissions() != null) {
            command.setPermissionIds(request.getPermissions().stream()
                    .map(PermissionItemRequest::getId)
                    .filter(id -> id != null && !id.isBlank())
                    .toList());
        }
        return command;
    }

    public static CreatePermissionCommand toCommand(CreatePermissionRequest request) {
        CreatePermissionCommand command = new CreatePermissionCommand();
        String code = request.getCode() != null && !request.getCode().isBlank()
                ? request.getCode()
                : request.getId();
        command.setId(code);
        command.setLabel(request.getLabel());
        command.setNote(request.getNote());
        command.setPageId(request.getPageId());
        command.setActionId(request.getActionId());
        return command;
    }

    public static CreatePermissionCommand toCommand(UpdatePermissionRequest request) {
        CreatePermissionCommand command = new CreatePermissionCommand();
        command.setLabel(request.getLabel());
        command.setNote(request.getNote());
        return command;
    }

    public static List<String> emptyIfNull(List<String> values) {
        return values == null ? List.of() : values;
    }
}
