package com.xxxx.ddd.application.service.user;

import com.xxxx.ddd.application.model.UserDTO;
import com.xxxx.ddd.application.model.UserPageDTO;
import com.xxxx.ddd.application.model.command.ChangePasswordCommand;
import com.xxxx.ddd.application.model.command.CreateUserCommand;
import com.xxxx.ddd.application.model.command.UpdateUserCommand;

public interface UserAppService {
    /** registrationStatus: null = every account, PENDING = self-registrations waiting for approval. */
    UserPageDTO search(String keyword, String registrationStatus, int pageNo, int pageSize);

    UserDTO getById(Long id);

    UserDTO create(CreateUserCommand command);

    UserDTO update(Long id, UpdateUserCommand command);

    void delete(Long id);

    void changePassword(ChangePasswordCommand command);

    void resetPassword(Long id);

    UserDTO approveRegistration(Long id, com.xxxx.ddd.application.model.command.ApproveRegistrationCommand command);

    void rejectRegistration(Long id);
}
