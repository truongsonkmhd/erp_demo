package com.xxxx.ddd.application.hr;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

/** Null fields stay as they are. */
@Data
public class UpdateAccountCommand {
    private List<@NotBlank String> roleCodes;
    private String positionCode;
    private Boolean active;
}
