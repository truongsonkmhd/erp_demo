package com.xxxx.ddd.infrastructure.persistence.repository;

import com.xxxx.ddd.domain.model.entity.AuditLog;
import com.xxxx.ddd.domain.respository.AuditLogRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.AuditLogJPAMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class AuditLogRepositoryImpl implements AuditLogRepository {
    private final AuditLogJPAMapper mapper;

    public AuditLogRepositoryImpl(AuditLogJPAMapper mapper) { this.mapper = mapper; }

    public AuditLog save(AuditLog log) { return mapper.save(log); }

    public List<AuditLog> findRecent(String resourceType, int offset, int limit) {
        return mapper.findRecent(resourceType, PageRequest.of(offset / Math.max(limit, 1), limit));
    }
}
