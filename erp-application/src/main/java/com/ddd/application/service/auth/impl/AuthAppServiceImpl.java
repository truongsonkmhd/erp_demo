package com.xxxx.ddd.application.service.auth.impl;

import com.xxxx.ddd.application.mapper.AuthMapper;
import com.xxxx.ddd.application.model.AuthenticationDTO;
import com.xxxx.ddd.application.model.CurrentUserDTO;
import com.xxxx.ddd.application.model.OrgUnitDTO;
import com.xxxx.ddd.application.model.UserDTO;
import com.xxxx.ddd.application.model.command.AuthenticateCommand;
import com.xxxx.ddd.application.model.command.RegisterCommand;
import com.xxxx.ddd.application.service.audit.AuditAppService;
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

import java.util.List;

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

    @Autowired
    private AuditAppService audit;

    @Autowired
    private com.xxxx.ddd.domain.respository.DepartmentRepository departmentRepository;

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
        // Password first: the account's state is only revealed to someone who knows its password.
        if (!passwordEncoder.matches(command.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        if (user.isPendingRegistration()) {
            throw new IllegalArgumentException("Account is pending approval");
        }
        if (Boolean.FALSE.equals(user.getActive()) || Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new IllegalArgumentException("User is inactive");
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

    @Override
    @Transactional
    public UserDTO register(RegisterCommand command) {
        validatePassword(command.getPassword());
        User user = new User()
                .setFullName(command.getFullName())
                .setEmail(command.getEmail())
                .setPhone(command.getPhone() == null || command.getPhone().isBlank() ? null : command.getPhone().trim())
                .setPassword(passwordEncoder.encode(command.getPassword()));
        User saved = userDomainService.register(user, command.getRequestedOrgUnitId());
        audit.record("register", AuditAppService.USER, saved.getId(),
                "email=" + saved.getEmail() + " requestedUnit=" + (saved.getRequestedOrgUnit() == null ? null : saved.getRequestedOrgUnit().getCode()));
        return AuthMapper.toUserDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrgUnitDTO> registrationUnits() {
        return departmentRepository.findAll().stream()
                .sorted(java.util.Comparator.comparing(com.xxxx.ddd.domain.model.entity.Department::getId))
                .map(d -> {
                    OrgUnitDTO dto = new OrgUnitDTO();
                    dto.setId(d.getId());
                    dto.setCode(d.getCode());
                    dto.setName(d.getName());
                    return dto;
                }).toList();
    }

    /** At least 8 characters with a letter and a digit. */
    private static void validatePassword(String password) {
        if (password == null || password.length() < 8 || password.length() > 100
                || !password.matches(".*[A-Za-z].*") || !password.matches(".*[0-9].*")) {
            throw new IllegalArgumentException("Password must be 8-100 characters and contain letters and digits");
        }
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
