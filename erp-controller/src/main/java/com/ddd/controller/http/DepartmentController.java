package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.service.audit.AuditAppService;
import com.xxxx.ddd.controller.dto.SaveDepartmentRequest;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.service.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {
    private final DepartmentService service;
    private final AuditAppService audit;

    public DepartmentController(DepartmentService service, AuditAppService audit) {
        this.service = service;
        this.audit = audit;
    }

    @GetMapping
    public ResultMessage<List<Department>> findAll() { return ResultUtil.data(service.findAll()); }

    @GetMapping("/{id}")
    public ResultMessage<Department> get(@PathVariable Long id) { return ResultUtil.data(service.get(id)); }

    @PostMapping
    public ResultMessage<Department> create(@Valid @RequestBody SaveDepartmentRequest request) {
        Department saved = service.create(request.getCode(), request.getName(), request.getDescription(), request.getParentId());
        audit.record("create", AuditAppService.DEPARTMENT, saved.getId(), describe(saved));
        return ResultUtil.data(saved);
    }

    @PutMapping("/{id}")
    public ResultMessage<Department> update(@PathVariable Long id, @Valid @RequestBody SaveDepartmentRequest request) {
        String before = describe(service.get(id));
        Department saved = service.update(id, request.getCode(), request.getName(), request.getDescription(), request.getParentId());
        audit.record("update", AuditAppService.DEPARTMENT, id, before + " -> " + describe(saved));
        return ResultUtil.data(saved);
    }

    @DeleteMapping("/{id}")
    public ResultMessage<Long> delete(@PathVariable Long id) {
        service.delete(id);
        audit.record("delete", AuditAppService.DEPARTMENT, id, null);
        return ResultUtil.data(id);
    }

    private static String describe(Department d) {
        return "code=" + d.getCode() + " parent=" + d.getParentId();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResultMessage<?> badRequest(IllegalArgumentException error) {
        return ResultUtil.error(400, error.getMessage());
    }
}
