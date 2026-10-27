package com.xxxx.ddd.application.service.auth;

import com.xxxx.ddd.application.model.AuthenticationDTO;
import com.xxxx.ddd.application.model.CurrentUserDTO;
import com.xxxx.ddd.application.model.command.AuthenticateCommand;

public interface AuthAppService {
    AuthenticationDTO authenticate(AuthenticateCommand command);

    AuthenticationDTO refreshToken(String refreshToken);

    AuthenticationDTO loginWithToken(String refreshToken);

    void logout(String token);

    CurrentUserDTO me(String username);
}
