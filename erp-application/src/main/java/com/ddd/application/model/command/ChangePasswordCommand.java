package com.xxxx.ddd.application.model.command;

import lombok.Data;

@Data
public class ChangePasswordCommand {
    private Long id;
    private String password;
    private String confirmPassword;
}
