package com.xxxx.ddd.domain.respository;

import com.xxxx.ddd.domain.model.entity.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository {
    User save(User user);

    Optional<User> findById(Long id);

    Optional<User> findByIdWithAuth(Long id);

    Optional<User> findByUsernameOrEmailWithAuth(String login);

    Optional<User> findByEmailWithAuth(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsernameAndIdNot(String username, Long id);

    boolean existsByEmailAndIdNot(String email, Long id);

    List<User> search(String keyword, int offset, int limit);

    long countSearch(String keyword);

    /** Active, not deleted users with roles, position and unit loaded. */
    List<User> findAllActive();

    long countByRoleId(Long roleId);
    long countActiveByRoleId(Long roleId);
}
