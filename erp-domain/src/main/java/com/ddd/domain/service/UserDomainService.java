package com.xxxx.ddd.domain.service;

import com.xxxx.ddd.domain.model.entity.User;

import java.util.List;

public interface UserDomainService {
    User createUser(User user, java.util.List<String> roleCodes, String levelCode);

    User updateUser(Long id, User patch, java.util.List<String> roleCodes, String levelCode);

    User getById(Long id);

    User getByUsernameOrEmail(String login);

    User getByEmail(String email);

    List<User> search(String keyword, int pageNo, int pageSize);

    long countSearch(String keyword);

    void changePassword(Long id, String encodedPassword);

    void deactivate(Long id);
}
