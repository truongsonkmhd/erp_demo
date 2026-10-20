package com.xxxx.ddd.application.model;

import lombok.Data;

import java.util.List;

@Data
public class UserPageDTO {
    private List<UserDTO> users;
    private int pageNo;
    private int pageSize;
    private long totalElements;
    private int totalPages;
}
