package com.xxxx.ddd.application.model;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class CurrentUserDTO extends UserDTO {
    private String roleName;
    private List<PermissionDTO> permissions;
}
