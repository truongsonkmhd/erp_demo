package com.xxxx.ddd.application.service.auth.impl;

import com.xxxx.ddd.application.mapper.AuthMapper;
import com.xxxx.ddd.application.model.AuthenticationDTO;
import com.xxxx.ddd.application.model.CurrentUserDTO;
import com.xxxx.ddd.application.model.command.AuthenticateCommand;
import com.xxxx.ddd.application.service.auth.AuthAppService;
import com.xxxx.ddd.application.service.auth.JwtService;
import com.xxxx.ddd.application.service.org.OrgAppService;
import com.xxxx.ddd.domain.model.entity.Token;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.service.UserDomainService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class AuthAppServiceImpl implements AuthAppService {

    @Autowired
    private UserDomainService userDomainService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private OrgAppService orgAppService;

    @Override
    @Transactional
    public AuthenticationDTO authenticate(AuthenticateCommand command) {
        if (command.getEmail() == null || command.getPassword() == null) {
            throw new IllegalArgumentException("Email and password are required");
        }
        String email = command.getEmail().trim();
        if (!email.contains("@")) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        User user = userDomainService.getByEmail(email);
        if (Boolean.FALSE.equals(user.getActive()) || Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new IllegalArgumentException("User is inactive");
        }
        if (!passwordEncoder.matches(command.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        boolean rememberMe = Boolean.TRUE.equals(command.getIsRememberMe());
        return issueTokens(user, rememberMe);
    }

    @Override
    @Transactional
    public AuthenticationDTO refreshToken(String refreshToken) {
        return rotateRefresh(refreshToken);
    }

    @Override
    @Transactional
    public AuthenticationDTO loginWithToken(String refreshToken) {
        return rotateRefresh(refreshToken);
    }

    @Override
    @Transactional
    public void logout(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token is required");
        }
        jwtService.invalidateAccessToken(token);
    }

    @Override
    @Transactional(readOnly = true)
    public CurrentUserDTO me(String username) {
        User user = userDomainService.getByUsernameOrEmail(username);
        CurrentUserDTO dto = AuthMapper.toCurrentUserDTO(user);
        dto.setManagedUnitCodes(orgAppService.managedUnitCodes(user));
        return dto;
    }

    private AuthenticationDTO rotateRefresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("Refresh token is required");
        }
        Token stored = jwtService.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));
        if (stored.getExpirationTime() != null && stored.getExpirationTime().isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalArgumentException("Refresh token expired");
        }
        User user = userDomainService.getById(stored.getUser().getId());
        if (Boolean.FALSE.equals(user.getActive()) || Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new IllegalArgumentException("User is inactive");
        }
        return issueTokens(user, false);
    }

    private AuthenticationDTO issueTokens(User user, boolean rememberMe) {
        String access = jwtService.generateAccessToken(user, rememberMe);
        String refresh = jwtService.generateRefreshToken(user, rememberMe);
        jwtService.persistTokens(user, access, refresh, rememberMe);
        AuthenticationDTO dto = new AuthenticationDTO();
        dto.setIsAuthenticated(true);
        dto.setToken(access);
        dto.setRefreshToken(refresh);
        return dto;
    }
}
