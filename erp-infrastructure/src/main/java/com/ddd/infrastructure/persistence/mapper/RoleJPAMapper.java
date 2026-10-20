package com.xxxx.ddd.infrastructure.persistence.mapper;

import com.xxxx.ddd.domain.model.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoleJPAMapper extends JpaRepository<Role, Long> {

    Optional<Role> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    long countByDepartmentId(Long departmentId);

    @Query("SELECT DISTINCT r FROM Role r LEFT JOIN FETCH r.permissions LEFT JOIN FETCH r.department WHERE r.id = :id AND (r.isDeleted = false OR r.isDeleted IS NULL)")
    Optional<Role> findByIdWithPermissions(@Param("id") Long id);

    @Query("SELECT DISTINCT r FROM Role r LEFT JOIN FETCH r.permissions LEFT JOIN FETCH r.department WHERE r.code = :code AND (r.isDeleted = false OR r.isDeleted IS NULL)")
    Optional<Role> findByCodeWithPermissions(@Param("code") String code);

    @Query("SELECT DISTINCT r FROM Role r LEFT JOIN FETCH r.permissions LEFT JOIN FETCH r.department WHERE r.isDeleted = false OR r.isDeleted IS NULL")
    List<Role> findAllActiveWithPermissions();

}
