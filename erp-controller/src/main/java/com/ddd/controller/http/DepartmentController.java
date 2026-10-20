package com.xxxx.ddd.controller.http;

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

    public DepartmentController(DepartmentService service) { this.service = service; }

    @GetMapping
    public ResultMessage<List<Department>> findAll() { return ResultUtil.data(service.findAll()); }

    @GetMapping("/{id}")
    public ResultMessage<Department> get(@PathVariable Long id) { return ResultUtil.data(service.get(id)); }

    @PostMapping
    public ResultMessage<Department> create(@Valid @RequestBody SaveDepartmentRequest request) {
        return ResultUtil.data(service.create(request.getCode(), request.getName(), request.getDescription()));
    }

    @PutMapping("/{id}")
    public ResultMessage<Department> update(@PathVariable Long id, @Valid @RequestBody SaveDepartmentRequest request) {
        return ResultUtil.data(service.update(id, request.getCode(), request.getName(), request.getDescription()));
    }

    @DeleteMapping("/{id}")
    public ResultMessage<Long> delete(@PathVariable Long id) {
        service.delete(id);
        return ResultUtil.data(id);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResultMessage<?> badRequest(IllegalArgumentException error) {
        return ResultUtil.error(400, error.getMessage());
    }
}
