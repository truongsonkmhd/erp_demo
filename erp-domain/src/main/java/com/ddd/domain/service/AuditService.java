package com.xxxx.ddd.domain.service;

import com.xxxx.ddd.domain.model.entity.AuditLog;
import com.xxxx.ddd.domain.respository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** Ghi nhận thao tác nhạy cảm; chạy trong transaction của thao tác để log và dữ liệu cùng commit hoặc cùng rollback. */
@Service
public class AuditService {
    private static final int MAX_DETAIL = 2000;

    private final AuditLogRepository repository;

    public AuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void record(Long actorId, String actorUsername, String action, String resourceType, Object resourceId, String detail) {
        String text = detail == null ? null : detail.length() > MAX_DETAIL ? detail.substring(0, MAX_DETAIL) : detail;
        repository.save(new AuditLog()
                .setActorId(actorId)
                .setActorUsername(actorUsername)
                .setAction(action)
                .setResourceType(resourceType)
                .setResourceId(resourceId == null ? null : String.valueOf(resourceId))
                .setDetail(text)
                .setCreatedAt(LocalDateTime.now()));
    }

    @Transactional(readOnly = true)
    public List<AuditLog> recent(String resourceType, int pageNo, int pageSize) {
        int size = pageSize <= 0 ? 20 : Math.min(pageSize, 200);
        int page = Math.max(pageNo, 1);
        return repository.findRecent(resourceType, (page - 1) * size, size);
    }
}
