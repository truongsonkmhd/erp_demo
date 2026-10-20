package com.xxxx.ddd.infrastructure.persistence.mapper;

import com.xxxx.ddd.domain.model.entity.Token;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TokenJPAMapper extends JpaRepository<Token, Long> {
    Optional<Token> findByUserId(Long userId);

    @Query("SELECT t FROM Token t JOIN FETCH t.user WHERE t.refreshToken = :refreshToken")
    Optional<Token> findByRefreshToken(@Param("refreshToken") String refreshToken);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM Token t WHERE t.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
