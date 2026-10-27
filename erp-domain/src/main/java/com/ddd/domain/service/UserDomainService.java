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

    User getById(Long id);

    User getByUsernameOrEmail(String login);

    User getByEmail(String email);

    List<User> search(String keyword, int pageNo, int pageSize);

    long countSearch(String keyword);

    void changePassword(Long id, String encodedPassword);

    void deactivate(Long id);
}
