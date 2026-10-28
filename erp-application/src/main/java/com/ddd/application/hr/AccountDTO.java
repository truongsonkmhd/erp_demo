package com.xxxx.ddd.application.hr;

import lombok.Data;

import java.util.List;

/** A login account on the Tài khoản page, with the hồ sơ nhân sự it belongs to (employeeCode null = not linked). */
@Data
public class AccountDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private boolean active;
    private List<String> roleCodes;
    private List<String> roleNames;
    private String positionCode;
    private String positionName;
    private String unitCode;
    private String unitName;
    private String employeeCode;
    private String employeeStatus;
    private String updatedAt;
}
