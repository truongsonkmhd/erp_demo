package com.xxxx.ddd.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateUserRequest {
    @NotBlank
    private String fullName;
    /** Optional — backend generates a unique username from email when blank. */
    private String username;
    @NotBlank
    private String password;
    @NotBlank
    @Pattern(regexp = "^[^\\s@]+@[^\\s@]+$", message = "Email must be a valid address")
    private String email;
    private String phone;
    private String roleCode;
    private java.util.List<String> roleCodes;
    private Integer accountType;
    private String levelId;
    /** Mã chức vụ (tbl_position.code); rỗng để bỏ chức vụ. */
    private String positionCode;
    /** Đơn vị (tbl_department.id); 0 để bỏ đơn vị. */
    private Long orgUnitId;
    private BigDecimal baseSalary;
    private Boolean active;
}
