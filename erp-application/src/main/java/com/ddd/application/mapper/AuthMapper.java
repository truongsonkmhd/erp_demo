package com.xxxx.ddd.application.mapper;

import com.xxxx.ddd.application.model.CurrentUserDTO;
import com.xxxx.ddd.application.model.OrgPersonDTO;
import com.xxxx.ddd.application.model.OrgUnitDTO;
import com.xxxx.ddd.application.model.PositionDTO;
import com.xxxx.ddd.application.model.PermissionDTO;
import com.xxxx.ddd.application.model.RoleDTO;
import com.xxxx.ddd.application.model.RoleLevelDTO;
import com.xxxx.ddd.application.model.UserDTO;
import com.xxxx.ddd.domain.model.auth.FixedRoleLevel;
import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.Permission;
import com.xxxx.ddd.domain.model.entity.Position;
import com.xxxx.ddd.domain.model.entity.Role;
import com.xxxx.ddd.domain.model.entity.User;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class AuthMapper {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private AuthMapper() {
    }

    public static UserDTO toUserDTO(User user) {
        if (user == null) {
            return null;
        }
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRoleCode());
        dto.setRoleCodes(user.getRoles().stream().map(Role::getCode).sorted().toList());
        dto.setAccountType(user.getAccountType());
        dto.setLevelId(user.getLevelCode());
        applyOrg(dto, user);
        dto.setBaseSalary(user.getBaseSalary());
        dto.setActive(user.getActive());
        dto.setCreatedAt(format(user.getCreatedAt()));
        dto.setUpdatedAt(format(user.getUpdatedAt()));
        return dto;
    }

    public static CurrentUserDTO toCurrentUserDTO(User user) {
        UserDTO base = toUserDTO(user);
        CurrentUserDTO dto = new CurrentUserDTO();
        dto.setId(base.getId());
        dto.setFullName(base.getFullName());
        dto.setUsername(base.getUsername());
        dto.setEmail(base.getEmail());
        dto.setPhone(base.getPhone());
        dto.setRole(base.getRole());
        dto.setRoleCodes(base.getRoleCodes());
        dto.setAccountType(base.getAccountType());
        dto.setLevelId(base.getLevelId());
        applyOrg(dto, user);
        dto.setBaseSalary(base.getBaseSalary());
        dto.setActive(base.getActive());
        dto.setCreatedAt(base.getCreatedAt());
        dto.setUpdatedAt(base.getUpdatedAt());
        dto.setRoleName(user.getRoles().stream().filter(role -> role.getCode().equals(user.getRoleCode())).map(Role::getName).findFirst().orElse(null));
        dto.setPermissions(toPermissionDTOs(user.getEffectivePermissions()));
        return dto;
    }

    private static void applyOrg(UserDTO dto, User user) {
        Position position = user.getPosition();
        if (position != null) {
            dto.setPositionCode(position.getCode());
            dto.setPositionName(position.getName());
            dto.setPositionLevel(position.getLevel());
        }
        Department unit = user.getOrgUnit();
        if (unit != null) {
            dto.setOrgUnitId(unit.getId());
            dto.setOrgUnitCode(unit.getCode());
            dto.setOrgUnitName(unit.getName());
        }
    }

    public static PositionDTO toPositionDTO(Position position) {
        PositionDTO dto = new PositionDTO();
        dto.setId(position.getId());
        dto.setCode(position.getCode());
        dto.setName(position.getName());
        dto.setLevel(position.getLevel());
        dto.setManagesUnit(Boolean.TRUE.equals(position.getManagesUnit()));
        return dto;
    }

    public static OrgUnitDTO toOrgUnitDTO(Department unit, java.util.Map<Long, Department> byId) {
        OrgUnitDTO dto = new OrgUnitDTO();
        dto.setId(unit.getId());
        dto.setCode(unit.getCode());
        dto.setName(unit.getName());
        dto.setDescription(unit.getDescription());
        dto.setParentId(unit.getParentId());
        Department parent = unit.getParentId() == null ? null : byId.get(unit.getParentId());
        dto.setParentCode(parent == null ? null : parent.getCode());
        return dto;
    }

    public static OrgPersonDTO toOrgPersonDTO(User user) {
        OrgPersonDTO dto = new OrgPersonDTO();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        List<Role> roles = user.getRoles().stream().sorted(Comparator.comparing(Role::getCode)).toList();
        dto.setRoleCodes(roles.stream().map(Role::getCode).toList());
        dto.setRoleNames(roles.stream().map(Role::getName).toList());
        Position position = user.getPosition();
        if (position != null) {
            dto.setPositionCode(position.getCode());
            dto.setPositionName(position.getName());
            dto.setPositionLevel(position.getLevel());
            dto.setManagesUnit(Boolean.TRUE.equals(position.getManagesUnit()));
        }
        if (user.getOrgUnit() != null) {
            dto.setOrgUnitCode(user.getOrgUnit().getCode());
            dto.setOrgUnitName(user.getOrgUnit().getName());
        }
        return dto;
    }

    public static RoleDTO toRoleDTO(Role role) {
        if (role == null) {
            return null;
        }
        RoleDTO dto = new RoleDTO();
        dto.setId(role.getId());
        dto.setCode(role.getCode());
        dto.setName(role.getName());
        dto.setSummary(role.getSummary());
        if (role.getDepartment() != null) {
            dto.setDepartmentId(role.getDepartment().getId());
            dto.setDepartmentName(role.getDepartment().getName());
        }
        dto.setPermissions(toPermissionDTOs(role.getPermissions()));
        if (role.hasNoLevels()) {
            dto.setLevels(List.of());
        } else {
            dto.setLevels(FixedRoleLevel.all().stream()
                    .map(fixed -> toRoleLevelDTO(fixed, Set.of()))
                    .toList());
        }
        return dto;
    }

    public static RoleLevelDTO toRoleLevelDTO(FixedRoleLevel level, Set<Permission> permissions) {
        RoleLevelDTO dto = new RoleLevelDTO();
        dto.setId(level.getCode());
        dto.setName(level.getName());
        dto.setSeat(level.getSeat());
        dto.setDescription(level.getDescription());
        dto.setPermissionIds(permissions == null ? List.of() : permissions.stream()
                .map(Permission::getCode)
                .toList());
        return dto;
    }

    public static PermissionDTO toPermissionDTO(Permission permission) {
        PermissionDTO dto = new PermissionDTO();
        dto.setId(permission.getCode());
        dto.setCode(permission.getCode());
        dto.setLabel(permission.getLabel());
        dto.setNote(permission.getNote());
        if (permission.getPage() != null) {
            dto.setPageId(permission.getPage().getId());
            dto.setPageCode(permission.getPage().getCode());
        }
        if (permission.getAction() != null) {
            dto.setActionId(permission.getAction().getId());
            dto.setActionCode(permission.getAction().getCode());
        }
        return dto;
    }

    public static List<PermissionDTO> toPermissionDTOs(Set<Permission> permissions) {
        if (permissions == null) {
            return List.of();
        }
        return permissions.stream()
                .sorted(Comparator.comparing(Permission::getCode, Comparator.nullsLast(String::compareTo)))
                .map(AuthMapper::toPermissionDTO)
                .collect(Collectors.toList());
    }

    private static String format(LocalDateTime value) {
        return value == null ? null : value.format(ISO);
    }
}
