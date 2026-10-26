package com.xxxx.ddd.application.model.command;

import lombok.Data;

@Data
public class RegisterCommand {
    private String fullName;
    private String email;
    private String phone;
    private String password;
    /** Đơn vị the person says they work in; a hint for the approving admin, never applied by itself. */
    private Long requestedOrgUnitId;
}
