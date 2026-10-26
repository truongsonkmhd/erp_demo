package com.xxxx.ddd.infrastructure.persistence.mapper;

import com.xxxx.ddd.domain.model.entity.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AuditLogJPAMapper extends JpaRepository<AuditLog, Long> {
    @Query("SELECT a FROM AuditLog a WHERE (:type IS NULL OR :type = '' OR a.resourceType = :type) ORDER BY a.createdAt DESC, a.id DESC")
    List<AuditLog> findRecent(@Param("type") String resourceType, Pageable pageable);
}
