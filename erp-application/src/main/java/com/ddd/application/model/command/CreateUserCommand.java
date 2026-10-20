package com.xxxx.ddd.application.model.command;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateUserCommand {
    private String fullName;
    private String username;
    private String password;
    private String email;
    private String phone;
    private String roleCode;
    private java.util.List<String> roleCodes;
    private Integer accountType;
    private String levelId;
    private BigDecimal baseSalary;
    private Boolean active;
}
