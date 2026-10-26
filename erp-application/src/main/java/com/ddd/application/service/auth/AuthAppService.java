package com.xxxx.ddd.application.service.auth;

import com.xxxx.ddd.application.model.AuthenticationDTO;
import com.xxxx.ddd.application.model.CurrentUserDTO;
import com.xxxx.ddd.application.model.OrgUnitDTO;
import com.xxxx.ddd.application.model.UserDTO;
import com.xxxx.ddd.application.model.command.AuthenticateCommand;
import com.xxxx.ddd.application.model.command.RegisterCommand;

import java.util.List;

public interface AuthAppService {
    AuthenticationDTO authenticate(AuthenticateCommand command);

    AuthenticationDTO refreshToken(String refreshToken);

    AuthenticationDTO loginWithToken(String refreshToken);

    void logout(String token);

    CurrentUserDTO me(String username);

    /** Self-registration: creates an account that waits for admin approval and cannot sign in yet. */
    UserDTO register(RegisterCommand command);

    /** Units a person can pick on the registration form (id, code, name only). */
    List<OrgUnitDTO> registrationUnits();
}
