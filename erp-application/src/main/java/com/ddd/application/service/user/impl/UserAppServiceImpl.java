package com.xxxx.ddd.application.service.user.impl;

import com.xxxx.ddd.application.mapper.AuthMapper;
import com.xxxx.ddd.application.model.UserDTO;
import com.xxxx.ddd.application.model.UserPageDTO;
import com.xxxx.ddd.application.model.command.ChangePasswordCommand;
import com.xxxx.ddd.application.model.command.CreateUserCommand;
import com.xxxx.ddd.application.model.command.UpdateUserCommand;
import com.xxxx.ddd.application.service.user.UserAppService;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.service.UserDomainService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
public class UserAppServiceImpl implements UserAppService {

    public static final String DEFAULT_PASSWORD = "123456";

    @Autowired
    private UserDomainService userDomainService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserPageDTO search(String keyword, int pageNo, int pageSize) {
        int page = pageNo <= 0 ? 1 : pageNo;
        int size = pageSize <= 0 ? 10 : pageSize;
        List<UserDTO> users = userDomainService.search(keyword, page, size).stream()
                .map(AuthMapper::toUserDTO)
                .toList();
        long total = userDomainService.countSearch(keyword);
        UserPageDTO pageDTO = new UserPageDTO();
        pageDTO.setUsers(users);
        pageDTO.setPageNo(page);
        pageDTO.setPageSize(size);
        pageDTO.setTotalElements(total);
        pageDTO.setTotalPages((int) Math.ceil(total / (double) size));
        return pageDTO;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO getById(Long id) {
        return AuthMapper.toUserDTO(userDomainService.getById(id));
    }

    @Override
    @Transactional
    public UserDTO create(CreateUserCommand command) {
        requireAdminForAssignedRoles(roles(command.getRoleCodes(), command.getRoleCode()));
        String username = command.getUsername();
        if (username != null && username.isBlank()) {
            username = null;
        }
        User user = new User()
                .setFullName(command.getFullName())
                .setUsername(username)
                .setEmail(command.getEmail())
                .setPhone(command.getPhone())
                .setPassword(passwordEncoder.encode(command.getPassword()))
                .setBaseSalary(command.getBaseSalary())
                .setActive(command.getActive() == null || command.getActive())
                .setAccountType(command.getAccountType() == null ? 2 : command.getAccountType());
        User saved = userDomainService.createUser(user, roles(command.getRoleCodes(), command.getRoleCode()), command.getLevelId());
        return AuthMapper.toUserDTO(saved);
    }

    @Override
    @Transactional
    public UserDTO update(Long id, UpdateUserCommand command) {
        requireAdminForTarget(id);
        requireAdminForAssignedRoles(roles(command.getRoleCodes(), command.getRoleCode()));
        User patch = new User()
                .setFullName(command.getFullName())
                .setUsername(command.getUsername())
                .setEmail(command.getEmail())
                .setPhone(command.getPhone())
                .setBaseSalary(command.getBaseSalary())
                .setActive(command.getActive())
                .setAccountType(command.getAccountType());
        User updated = userDomainService.updateUser(id, patch, roles(command.getRoleCodes(), command.getRoleCode()), command.getLevelId());
        return AuthMapper.toUserDTO(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        requireAdminForTarget(id);
        userDomainService.deactivate(id);
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordCommand command) {
        if (command.getId() == null) {
            throw new IllegalArgumentException("User id is required");
        }
        requireAdminForTarget(command.getId());
        if (command.getPassword() == null || command.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (!command.getPassword().equals(command.getConfirmPassword())) {
            throw new IllegalArgumentException("Password confirmation does not match");
        }
        userDomainService.changePassword(command.getId(), passwordEncoder.encode(command.getPassword()));
    }

    @Override
    @Transactional
    public void resetPassword(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("User id is required");
        }
        requireAdminForTarget(id);
        userDomainService.getById(id);
        userDomainService.changePassword(id, passwordEncoder.encode(DEFAULT_PASSWORD));
    }

    private List<String> roles(List<String> codes, String legacyCode) {
        return codes != null ? codes : legacyCode == null ? null : List.of(legacyCode);
    }

    private boolean callerIsAdmin() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    private void requireAdminForAssignedRoles(List<String> roleCodes) {
        if (roleCodes != null && roleCodes.stream().anyMatch(code -> "admin".equalsIgnoreCase(code)) && !callerIsAdmin()) {
            throw new AccessDeniedException("Only admin may assign the admin role");
        }
    }

    private void requireAdminForTarget(Long userId) {
        if (!callerIsAdmin() && userDomainService.getById(userId).getRoles().stream().anyMatch(role -> role.isAdmin())) {
            throw new AccessDeniedException("Only admin may modify an admin account");
        }
    }
}
