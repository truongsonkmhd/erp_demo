package com.xxxx.ddd.application.model;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class MenuDTO {
    private Long id;
    private String code;
    private String title;
    private String icon;
    private String url;
    private String pageCode;
    private String module;
    private Integer sortOrder;
    private List<MenuDTO> children = new ArrayList<>();
}
