package com.xxxx.ddd.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    @Size(max = 255)
    private String fullName;
    @NotBlank
    @Size(max = 200)
    @Pattern(regexp = "^[^\s@]+@[^\s@]+$", message = "Email must be a valid address")
    private String email;
    @Size(max = 20)
    private String phone;
    @NotBlank
    @Size(min = 8, max = 100)
    private String password;
    /** Đơn vị the person says they work in (optional, only a hint for the approving admin). */
    private Long requestedOrgUnitId;
}
