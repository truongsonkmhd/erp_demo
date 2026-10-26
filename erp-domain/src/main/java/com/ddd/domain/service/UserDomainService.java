package com.xxxx.ddd.domain.service;

import com.xxxx.ddd.domain.model.entity.User;

import java.util.List;

public interface UserDomainService {
    /**
     * positionCode / orgUnitId: chức vụ and đơn vị of the user. On update null keeps the current value, while a blank
     * code or an id &lt;= 0 clears it.
     */
    User createUser(User user, java.util.List<String> roleCodes, String levelCode, String positionCode, Long orgUnitId);

    User updateUser(Long id, User patch, java.util.List<String> roleCodes, String levelCode, String positionCode, Long orgUnitId);

    /**
     * Tự đăng ký: the account is created inactive, without any role, chức vụ or đơn vị, and waits for an admin.
     * requestedOrgUnitId is only recorded as the đơn vị the person claims (may be null).
     */
    User register(User user, Long requestedOrgUnitId);

    /** Grants roles, chức vụ and đơn vị to a pending registration and activates it. */
    User approveRegistration(Long id, java.util.List<String> roleCodes, String levelCode, String positionCode, Long orgUnitId);

    /** Rejects a pending registration; the email becomes free to register again. */
    User rejectRegistration(Long id);

    User getById(Long id);

    User getByUsernameOrEmail(String login);

    User getByEmail(String email);

    List<User> search(String keyword, String registrationStatus, int pageNo, int pageSize);

    long countSearch(String keyword, String registrationStatus);

    void changePassword(Long id, String encodedPassword);

    void deactivate(Long id);
}
