package com.xxxx.ddd.infrastructure.persistence.repository;

import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.respository.PermissionRepository;
import com.xxxx.ddd.domain.respository.UserRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.UserJPAMapper;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class UserRepositoryImpl implements UserRepository {

    @Autowired
    private UserJPAMapper userJPAMapper;

    @Autowired
    private PermissionRepository permissionRepository;

    @Override
    public User save(User user) {
        return userJPAMapper.save(user);
    }

    @Override
    public Optional<User> findById(Long id) {
        return userJPAMapper.findById(id);
    }

    @Override
    public Optional<User> findByIdWithAuth(Long id) {
        Optional<User> user = userJPAMapper.findByIdWithAuth(id);
        user.ifPresent(this::initializeAuth);
        return user;
    }

    @Override
    public Optional<User> findByUsernameOrEmailWithAuth(String login) {
        Optional<User> user = userJPAMapper.findByUsernameOrEmailWithAuth(login);
        user.ifPresent(this::initializeAuth);
        return user;
    }

    @Override
    public Optional<User> findByEmailWithAuth(String email) {
        Optional<User> user = userJPAMapper.findByEmailWithAuth(email);
        user.ifPresent(this::initializeAuth);
        return user;
    }

    @Override
    public boolean existsByUsername(String username) {
        return userJPAMapper.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userJPAMapper.existsByEmail(email);
    }

    @Override
    public boolean existsByUsernameAndIdNot(String username, Long id) {
        return userJPAMapper.existsByUsernameAndIdNot(username, id);
    }

    @Override
    public boolean existsByEmailAndIdNot(String email, Long id) {
        return userJPAMapper.existsByEmailAndIdNot(email, id);
    }

    @Override
    public List<User> search(String keyword, String registrationStatus, int offset, int limit) {
        int page = offset / Math.max(limit, 1);
        List<User> users = userJPAMapper.search(keyword == null ? "" : keyword,
                registrationStatus == null ? "" : registrationStatus, PageRequest.of(page, limit));
        users.forEach(this::initializeAuth);
        return users;
    }

    @Override
    public long countSearch(String keyword, String registrationStatus) {
        return userJPAMapper.countSearch(keyword == null ? "" : keyword, registrationStatus == null ? "" : registrationStatus);
    }

    @Override
    public List<User> findAllActive() {
        return userJPAMapper.findAllActive();
    }

    @Override
    public long countByRoleId(Long roleId) {
        return userJPAMapper.countByRoleId(roleId);
    }

    @Override
    public long countActiveByRoleId(Long roleId) {
        return userJPAMapper.countActiveByRoleId(roleId);
    }

    private void initializeAuth(User user) {
        for (var role : user.getRoles()) {
            Hibernate.initialize(role.getPermissions());
        }
        if (user.getRoles().stream().anyMatch(com.xxxx.ddd.domain.model.entity.Role::isAdmin)) {
            user.setCatalogPermissions(new HashSet<>(permissionRepository.findAll()));
        }
    }
}
