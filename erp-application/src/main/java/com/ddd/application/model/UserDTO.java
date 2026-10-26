package com.xxxx.ddd.application.model;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class UserDTO {
    private Long id;
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private String role;
    private java.util.List<String> roleCodes;
    private Integer accountType;
    private String levelId;
    private String positionCode;
    private String positionName;
    private Integer positionLevel;
    private Long orgUnitId;
    private String orgUnitCode;
    private String orgUnitName;
    private BigDecimal baseSalary;
    private Boolean active;
    private String createdAt;
    private String updatedAt;
}
