package com.xxxx.ddd.application.model;

import lombok.Data;

@Data
public class PositionDTO {
    private Long id;
    private String code;
    private String name;
    private Integer level;
    private Boolean managesUnit;
}
