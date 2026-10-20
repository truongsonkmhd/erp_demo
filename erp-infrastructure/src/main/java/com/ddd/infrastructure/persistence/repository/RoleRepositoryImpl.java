package com.xxxx.ddd.infrastructure.persistence.repository;

import com.xxxx.ddd.domain.model.entity.Role;
import com.xxxx.ddd.domain.respository.RoleRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.RoleJPAMapper;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoleRepositoryImpl implements RoleRepository {

    @Autowired
    private RoleJPAMapper roleJPAMapper;

    @Override
    public Role save(Role role) {
        return roleJPAMapper.save(role);
    }

    @Override
    public Optional<Role> findById(Long id) {
        return roleJPAMapper.findById(id);
    }

    @Override
    public Optional<Role> findByIdWithDetails(Long id) {
        return roleJPAMapper.findByIdWithPermissions(id).map(this::initialize);
    }

    @Override
    public Optional<Role> findByCode(String code) {
        return roleJPAMapper.findByCode(code);
    }

    @Override
    public Optional<Role> findByCodeWithDetails(String code) {
        return roleJPAMapper.findByCodeWithPermissions(code).map(this::initialize);
    }

    @Override
    public List<Role> findAllActiveWithDetails() {
        return roleJPAMapper.findAllActiveWithPermissions().stream()
                .map(this::initialize)
                .toList();
    }

    @Override
    public boolean existsByCode(String code) {
        return roleJPAMapper.existsByCode(code);
    }

    @Override
    public boolean existsByCodeAndIdNot(String code, Long id) {
        return roleJPAMapper.existsByCodeAndIdNot(code, id);
    }

    private Role initialize(Role role) {
        Hibernate.initialize(role.getPermissions());
        if (role.getDepartment() != null) Hibernate.initialize(role.getDepartment());
        return role;
    }
}
