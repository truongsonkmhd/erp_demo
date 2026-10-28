package com.xxxx.ddd.application.hr;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/** Account for a hồ sơ nhân sự; email falls back to the profile's, username to the e-mail's local part. */
@Data
public class CreateAccountCommand {
    @NotBlank
    private String employeeCode;

    @Pattern(regexp = "([A-Za-z0-9._-]{3,100})?")
    private String username;

    @Email
    @Size(max = 150)
    private String email;

    @NotEmpty
    private List<@NotBlank String> roleCodes;

    private String positionCode;
}
