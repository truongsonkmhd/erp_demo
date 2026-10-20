package com.xxxx.ddd.application.service.user;

import com.xxxx.ddd.application.model.UserDTO;
import com.xxxx.ddd.application.model.UserPageDTO;
import com.xxxx.ddd.application.model.command.ChangePasswordCommand;
import com.xxxx.ddd.application.model.command.CreateUserCommand;
import com.xxxx.ddd.application.model.command.UpdateUserCommand;

public interface UserAppService {
    UserPageDTO search(String keyword, int pageNo, int pageSize);

    UserDTO getById(Long id);

    UserDTO create(CreateUserCommand command);

    UserDTO update(Long id, UpdateUserCommand command);

    void delete(Long id);

    void changePassword(ChangePasswordCommand command);

    void resetPassword(Long id);
}
