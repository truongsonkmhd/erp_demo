package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.model.RoleDTO;
import com.xxxx.ddd.application.service.role.RoleAppService;
import com.xxxx.ddd.controller.dto.SaveRoleRequest;
import com.xxxx.ddd.controller.mapper.AuthControllerMapper;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@Slf4j
public class RoleController {

    @Autowired
    private RoleAppService roleAppService;

    @GetMapping
    public ResultMessage<List<RoleDTO>> findAll() {
        try {
            return ResultUtil.data(roleAppService.findAll());
        } catch (Exception e) {
            log.error("List roles error", e);
            return ResultUtil.error(500, "Failed to list roles");
        }
    }

    @GetMapping("/{id}")
    public ResultMessage<RoleDTO> getById(@PathVariable Long id) {
        try {
            return ResultUtil.data(roleAppService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(404, e.getMessage());
        } catch (Exception e) {
            log.error("Get role error", e);
            return ResultUtil.error(500, "Failed to get role");
        }
    }

    @PostMapping
    public ResultMessage<RoleDTO> create(@Valid @RequestBody SaveRoleRequest request) {
        try {
            return ResultUtil.data(roleAppService.create(AuthControllerMapper.toCommand(request)));
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(400, e.getMessage());
        } catch (Exception e) {
            log.error("Create role error", e);
            return ResultUtil.error(500, "Failed to create role");
        }
    }

    @PutMapping("/{id}")
    public ResultMessage<RoleDTO> update(@PathVariable Long id, @Valid @RequestBody SaveRoleRequest request) {
        try {
            return ResultUtil.data(roleAppService.update(id, AuthControllerMapper.toCommand(request)));
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(400, e.getMessage());
        } catch (Exception e) {
            log.error("Update role error", e);
            return ResultUtil.error(500, "Failed to update role");
        }
    }

    @DeleteMapping("/{id}")
    public ResultMessage<Long> delete(@PathVariable Long id) {
        try {
            roleAppService.delete(id);
            return ResultUtil.data(id);
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(400, e.getMessage());
        } catch (Exception e) {
            log.error("Delete role error", e);
            return ResultUtil.error(500, "Failed to delete role");
        }
    }

}
