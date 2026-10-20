package com.xxxx.ddd.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    @NotNull
    private Long id;
    @NotBlank
    private String password;
    @NotBlank
    private String confirmPassword;
}
