package com.xxxx.ddd.controller.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ApproveRegistrationRequest {
    @NotEmpty
    private List<String> roleCodes;
    private String levelId;
    private String positionCode;
    /** Null keeps the đơn vị the person requested. */
    private Long orgUnitId;
}
