package com.xxxx.ddd.domain.respository;

import com.xxxx.ddd.domain.model.entity.Role;

import java.util.List;
import java.util.Optional;

public interface RoleRepository {
    Role save(Role role);

    Optional<Role> findById(Long id);

    Optional<Role> findByIdWithDetails(Long id);

    Optional<Role> findByCode(String code);

    Optional<Role> findByCodeWithDetails(String code);

    List<Role> findAllActiveWithDetails();

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);
}
