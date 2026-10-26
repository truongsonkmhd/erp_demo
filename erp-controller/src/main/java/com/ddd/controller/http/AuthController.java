package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.model.AuthenticationDTO;
import com.xxxx.ddd.application.model.CurrentUserDTO;
import com.xxxx.ddd.application.model.OrgUnitDTO;
import com.xxxx.ddd.application.model.UserDTO;
import com.xxxx.ddd.application.model.command.RegisterCommand;
import com.xxxx.ddd.application.service.auth.AuthAppService;
import com.xxxx.ddd.controller.dto.AuthenticateRequest;
import com.xxxx.ddd.controller.dto.LogoutRequest;
import com.xxxx.ddd.controller.dto.RefreshTokenRequest;
import com.xxxx.ddd.controller.dto.RegisterRequest;
import com.xxxx.ddd.controller.mapper.AuthControllerMapper;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/authenticate")
@Slf4j
public class AuthController {

    @Autowired
    private AuthAppService authAppService;

    @PostMapping
    public ResultMessage<AuthenticationDTO> login(@Valid @RequestBody AuthenticateRequest request) {
        try {
            return ResultUtil.data(authAppService.authenticate(AuthControllerMapper.toCommand(request)));
        } catch (IllegalArgumentException e) {
            log.warn("Login failed: {}", e.getMessage());
            return ResultUtil.error(401, e.getMessage());
        } catch (Exception e) {
            log.error("Login error", e);
            return ResultUtil.error(500, "Failed to authenticate");
        }
    }

    /** Public: creates an account waiting for admin approval (no role, chức vụ or đơn vị until approved). */
    @PostMapping("/register")
    public ResultMessage<UserDTO> register(@Valid @RequestBody RegisterRequest request) {
        try {
            RegisterCommand command = new RegisterCommand();
            command.setFullName(request.getFullName());
            command.setEmail(request.getEmail());
            command.setPhone(request.getPhone());
            command.setPassword(request.getPassword());
            command.setRequestedOrgUnitId(request.getRequestedOrgUnitId());
            return ResultUtil.data(authAppService.register(command));
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(400, e.getMessage());
        } catch (Exception e) {
            log.error("Register error", e);
            return ResultUtil.error(500, "Failed to register");
        }
    }

    /** Public: units offered on the registration form. */
    @GetMapping("/register/units")
    public ResultMessage<java.util.List<OrgUnitDTO>> registrationUnits() {
        return ResultUtil.data(authAppService.registrationUnits());
    }

    @PostMapping("/refresh-token")
    public ResultMessage<AuthenticationDTO> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            return ResultUtil.data(authAppService.refreshToken(request.getRefreshToken()));
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(401, e.getMessage());
        } catch (Exception e) {
            log.error("Refresh token error", e);
            return ResultUtil.error(500, "Failed to refresh token");
        }
    }

    @PostMapping("/login-with-token")
    public ResultMessage<AuthenticationDTO> loginWithToken(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            return ResultUtil.data(authAppService.loginWithToken(request.getRefreshToken()));
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(401, e.getMessage());
        } catch (Exception e) {
            log.error("Login with token error", e);
            return ResultUtil.error(500, "Failed to login with token");
        }
    }

    @PostMapping("/logout")
    public ResultMessage<Void> logout(@Valid @RequestBody LogoutRequest request) {
        try {
            authAppService.logout(request.getToken());
            return ResultUtil.success();
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(400, e.getMessage());
        } catch (Exception e) {
            log.error("Logout error", e);
            return ResultUtil.error(500, "Failed to logout");
        }
    }

    @GetMapping("/me")
    public ResultMessage<CurrentUserDTO> me(Authentication authentication) {
        try {
            if (authentication == null) {
                return ResultUtil.error(401, "Unauthorized");
            }
            return ResultUtil.data(authAppService.me(authentication.getName()));
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(401, e.getMessage());
        } catch (Exception e) {
            log.error("Get current user error", e);
            return ResultUtil.error(500, "Failed to load current user");
        }
    }
}
