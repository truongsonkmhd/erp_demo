package com.xxxx.ddd.application.model.command;

import lombok.Data;

@Data
public class AuthenticateCommand {
    private String email;
    private String password;
    private Boolean isRememberMe;
}
