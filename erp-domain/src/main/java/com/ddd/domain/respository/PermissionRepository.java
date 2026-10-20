package com.xxxx.ddd.domain.respository;

import com.xxxx.ddd.domain.model.entity.Permission;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface PermissionRepository {
    Permission save(Permission permission);

    Optional<Permission> findById(Long id);

    Optional<Permission> findByCode(String code);

    List<Permission> findAll();

    List<Permission> findByCodes(Set<String> codes);

    boolean existsByCode(String code);

    void deleteById(Long id);

    void deleteRoleLinks(Long permissionId);

}
