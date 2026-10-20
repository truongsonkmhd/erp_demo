package com.xxxx.ddd.infrastructure.persistence.mapper;

import com.xxxx.ddd.domain.model.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PermissionJPAMapper extends JpaRepository<Permission, Long> {
    Optional<Permission> findByCode(String code);

    boolean existsByCode(String code);

    List<Permission> findByCodeIn(Collection<String> codes);

    @Modifying
    @Query(value = "DELETE FROM tbl_role_permission WHERE permission_id = :permissionId", nativeQuery = true)
    void deleteRoleLinks(@Param("permissionId") Long permissionId);

}
