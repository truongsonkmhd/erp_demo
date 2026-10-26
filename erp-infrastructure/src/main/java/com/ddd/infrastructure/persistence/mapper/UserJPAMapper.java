package com.xxxx.ddd.infrastructure.persistence.mapper;

import com.xxxx.ddd.domain.model.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserJPAMapper extends JpaRepository<User, Long> {

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.id = :id AND (u.isDeleted = false OR u.isDeleted IS NULL)")
    Optional<User> findByIdWithAuth(@Param("id") Long id);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE (LOWER(u.username) = LOWER(:login) OR LOWER(u.email) = LOWER(:login)) AND (u.isDeleted = false OR u.isDeleted IS NULL)")
    Optional<User> findByUsernameOrEmailWithAuth(@Param("login") String login);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE LOWER(u.email) = LOWER(:email) AND (u.isDeleted = false OR u.isDeleted IS NULL)")
    Optional<User> findByEmailWithAuth(@Param("email") String email);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE LOWER(u.username) = LOWER(:username) AND (u.isDeleted = false OR u.isDeleted IS NULL)")
    boolean existsByUsername(@Param("username") String username);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE LOWER(u.email) = LOWER(:email) AND (u.isDeleted = false OR u.isDeleted IS NULL)")
    boolean existsByEmail(@Param("email") String email);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE LOWER(u.username) = LOWER(:username) AND u.id <> :id AND (u.isDeleted = false OR u.isDeleted IS NULL)")
    boolean existsByUsernameAndIdNot(@Param("username") String username, @Param("id") Long id);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE LOWER(u.email) = LOWER(:email) AND u.id <> :id AND (u.isDeleted = false OR u.isDeleted IS NULL)")
    boolean existsByEmailAndIdNot(@Param("email") String email, @Param("id") Long id);

    @Query("SELECT u FROM User u WHERE (u.isDeleted = false OR u.isDeleted IS NULL) AND (:keyword IS NULL OR :keyword = '' OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND (:status = '' OR u.registrationStatus = :status) ORDER BY u.updatedAt DESC")
    List<User> search(@Param("keyword") String keyword, @Param("status") String status, Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE (u.isDeleted = false OR u.isDeleted IS NULL) AND (:keyword IS NULL OR :keyword = '' OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND (:status = '' OR u.registrationStatus = :status)")
    long countSearch(@Param("keyword") String keyword, @Param("status") String status);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles LEFT JOIN FETCH u.position LEFT JOIN FETCH u.orgUnit WHERE u.active = true AND (u.isDeleted = false OR u.isDeleted IS NULL) ORDER BY u.fullName")
    List<User> findAllActive();

    @Query("SELECT COUNT(u) FROM User u WHERE u.orgUnit.id = :departmentId AND (u.isDeleted = false OR u.isDeleted IS NULL)")
    long countByOrgUnitId(@Param("departmentId") Long departmentId);

    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.roles r WHERE r.id = :roleId AND (u.isDeleted = false OR u.isDeleted IS NULL)")
    long countByRoleId(@Param("roleId") Long roleId);

    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.roles r WHERE r.id = :roleId AND u.active = true AND (u.isDeleted = false OR u.isDeleted IS NULL)")
    long countActiveByRoleId(@Param("roleId") Long roleId);
}
