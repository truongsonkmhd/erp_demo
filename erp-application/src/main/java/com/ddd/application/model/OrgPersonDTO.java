package com.xxxx.ddd.application.model;

import lombok.Data;

import java.util.List;

/** Public directory entry: who someone is in the organisation, without account or salary data. */
@Data
public class OrgPersonDTO {
    private Long id;
    private String fullName;
    private List<String> roleCodes;
    private List<String> roleNames;
    private String positionCode;
    private String positionName;
    private Integer positionLevel;
    private Boolean managesUnit;
    private String orgUnitCode;
    private String orgUnitName;
}
