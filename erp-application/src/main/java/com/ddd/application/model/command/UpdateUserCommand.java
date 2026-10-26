package com.xxxx.ddd.application.model.command;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateUserCommand {
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private String roleCode;
    private java.util.List<String> roleCodes;
    private Integer accountType;
    private String levelId;
    private String positionCode;
    private Long orgUnitId;
    private BigDecimal baseSalary;
    private Boolean active;
}
