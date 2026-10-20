package com.xxxx.ddd.controller.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateUserRequest {
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private String roleCode;
    private java.util.List<String> roleCodes;
    private Integer accountType;
    private String levelId;
    private BigDecimal baseSalary;
    private Boolean active;
}
