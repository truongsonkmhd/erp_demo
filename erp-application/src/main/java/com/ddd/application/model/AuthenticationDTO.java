package com.xxxx.ddd.application.model;

import lombok.Data;

@Data
public class AuthenticationDTO {
    private Boolean isAuthenticated;
    private String token;
    private String refreshToken;
}
