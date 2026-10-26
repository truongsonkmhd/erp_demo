package com.xxxx.ddd.application.service.audit;

import com.xxxx.ddd.application.model.AuditLogDTO;
import com.xxxx.ddd.application.service.security.CurrentActor;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.service.AuditService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;

/** Audit of sensitive changes, attributed to the signed-in user. */
@Service
public class AuditAppService {
    public static final String USER = "user";
    public static final String ROLE = "role";
    public static final String PERMISSION = "permission";
    public static final String DEPARTMENT = "department";

    private final AuditService auditService;
    private final CurrentActor currentActor;

    public AuditAppService(AuditService auditService, CurrentActor currentActor) {
        this.auditService = auditService;
        this.currentActor = currentActor;
    }

    @Transactional
    public void record(String action, String resourceType, Object resourceId, String detail) {
        User actor = currentActor.find().orElse(null);
        auditService.record(actor == null ? null : actor.getId(),
                actor == null ? currentActor.username().orElse(null) : actor.getUsername(),
                action, resourceType, resourceId, detail);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> recent(String resourceType, int pageNo, int pageSize) {
        return auditService.recent(resourceType, pageNo, pageSize).stream().map(log -> {
            AuditLogDTO dto = new AuditLogDTO();
            dto.setId(log.getId());
            dto.setActorId(log.getActorId());
            dto.setActorUsername(log.getActorUsername());
            dto.setAction(log.getAction());
            dto.setResourceType(log.getResourceType());
            dto.setResourceId(log.getResourceId());
            dto.setDetail(log.getDetail());
            dto.setCreatedAt(log.getCreatedAt() == null ? null : log.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            return dto;
        }).toList();
    }
}
