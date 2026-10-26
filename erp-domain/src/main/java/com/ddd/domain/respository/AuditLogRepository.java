package com.xxxx.ddd.domain.respository;

import com.xxxx.ddd.domain.model.entity.AuditLog;

import java.util.List;

public interface AuditLogRepository {
    AuditLog save(AuditLog log);

    List<AuditLog> findRecent(String resourceType, int offset, int limit);
}
