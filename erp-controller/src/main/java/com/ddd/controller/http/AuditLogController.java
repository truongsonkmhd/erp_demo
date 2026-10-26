package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.model.AuditLogDTO;
import com.xxxx.ddd.application.service.audit.AuditAppService;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Lịch sử thay đổi quyền, chức vụ, đơn vị và tài khoản – chỉ quản trị viên hệ thống (BR-07). */
@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {
    private final AuditAppService audit;

    public AuditLogController(AuditAppService audit) {
        this.audit = audit;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResultMessage<List<AuditLogDTO>> recent(
            @RequestParam(required = false) String resourceType,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "50") int pageSize) {
        return ResultUtil.data(audit.recent(resourceType, pageNo, pageSize));
    }
}
