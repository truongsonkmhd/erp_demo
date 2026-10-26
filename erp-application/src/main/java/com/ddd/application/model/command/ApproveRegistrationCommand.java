package com.xxxx.ddd.application.model.command;

import lombok.Data;

import java.util.List;

@Data
public class ApproveRegistrationCommand {
    private List<String> roleCodes;
    private String levelId;
    private String positionCode;
    /** Null keeps the đơn vị the person requested. */
    private Long orgUnitId;
}
