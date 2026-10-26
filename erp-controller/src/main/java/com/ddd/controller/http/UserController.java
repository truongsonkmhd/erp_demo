package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.model.UserDTO;
import com.xxxx.ddd.application.model.UserPageDTO;
import com.xxxx.ddd.application.service.user.UserAppService;
import com.xxxx.ddd.application.model.command.ApproveRegistrationCommand;
import com.xxxx.ddd.controller.dto.ApproveRegistrationRequest;
import com.xxxx.ddd.controller.dto.ChangePasswordRequest;
import com.xxxx.ddd.controller.dto.CreateUserRequest;
import com.xxxx.ddd.controller.dto.UpdateUserRequest;
import com.xxxx.ddd.controller.mapper.AuthControllerMapper;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@Slf4j
public class UserController {

    @Autowired
    private UserAppService userAppService;

    @GetMapping
    public ResultMessage<UserPageDTO> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String registrationStatus,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize) {
        try {
            return ResultUtil.data(userAppService.search(keyword, registrationStatus, pageNo, pageSize));
        } catch (Exception e) {
            log.error("Search users error", e);
            return ResultUtil.error(500, "Failed to search users");
        }
    }

    @GetMapping("/{id}")
    public ResultMessage<UserDTO> getById(@PathVariable Long id) {
        try {
            return ResultUtil.data(userAppService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(404, e.getMessage());
        } catch (Exception e) {
            log.error("Get user error", e);
            return ResultUtil.error(500, "Failed to get user");
        }
    }

    @PostMapping
    public ResultMessage<UserDTO> create(@Valid @RequestBody CreateUserRequest request) {
        try {
            return ResultUtil.data(userAppService.create(AuthControllerMapper.toCommand(request)));
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(400, e.getMessage());
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Create user error", e);
            return ResultUtil.error(500, "Failed to create user");
        }
    }

    @PutMapping("/{id}")
    public ResultMessage<UserDTO> update(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        try {
            return ResultUtil.data(userAppService.update(id, AuthControllerMapper.toCommand(request)));
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(400, e.getMessage());
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Update user error", e);
            return ResultUtil.error(500, "Failed to update user");
        }
    }

    @DeleteMapping("/{id}")
    public ResultMessage<Long> delete(@PathVariable Long id) {
        try {
            userAppService.delete(id);
            return ResultUtil.data(id);
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(400, e.getMessage());
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Delete user error", e);
            return ResultUtil.error(500, "Failed to delete user");
        }
    }

    @PostMapping("/{id}/reset-password")
    public ResultMessage<Long> resetPassword(@PathVariable Long id) {
        try {
            userAppService.resetPassword(id);
            return ResultUtil.data(id);
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(400, e.getMessage());
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Reset password error", e);
            return ResultUtil.error(500, "Failed to reset password");
        }
    }

    /** Grants roles, chức vụ and đơn vị to a self-registered account and activates it (users:update). */
    @PostMapping("/{id}/approve")
    public ResultMessage<UserDTO> approve(@PathVariable Long id, @Valid @RequestBody ApproveRegistrationRequest request) {
        try {
            ApproveRegistrationCommand command = new ApproveRegistrationCommand();
            command.setRoleCodes(request.getRoleCodes());
            command.setLevelId(request.getLevelId());
            command.setPositionCode(request.getPositionCode());
            command.setOrgUnitId(request.getOrgUnitId());
            return ResultUtil.data(userAppService.approveRegistration(id, command));
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(400, e.getMessage());
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Approve registration error", e);
            return ResultUtil.error(500, "Failed to approve registration");
        }
    }

    @PostMapping("/{id}/reject")
    public ResultMessage<Long> reject(@PathVariable Long id) {
        try {
            userAppService.rejectRegistration(id);
            return ResultUtil.data(id);
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(400, e.getMessage());
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Reject registration error", e);
            return ResultUtil.error(500, "Failed to reject registration");
        }
    }

    @PatchMapping("/change-pwd")
    public ResultMessage<Long> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        try {
            userAppService.changePassword(AuthControllerMapper.toCommand(request));
            return ResultUtil.data(request.getId());
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(400, e.getMessage());
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Change password error", e);
            return ResultUtil.error(500, "Failed to change password");
        }
    }
}
