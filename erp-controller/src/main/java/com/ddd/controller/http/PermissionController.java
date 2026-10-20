package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.model.PermissionDTO;
import com.xxxx.ddd.application.service.role.RoleAppService;
import com.xxxx.ddd.controller.dto.CreatePermissionRequest;
import com.xxxx.ddd.controller.dto.UpdatePermissionRequest;
import com.xxxx.ddd.controller.mapper.AuthControllerMapper;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
@Slf4j
public class PermissionController {

    @Autowired
    private RoleAppService roleAppService;

    @GetMapping
    public ResultMessage<List<PermissionDTO>> findAll() {
        try {
            return ResultUtil.data(roleAppService.findAllPermissions());
        } catch (Exception e) {
            log.error("List permissions error", e);
            return ResultUtil.error(500, "Failed to list permissions");
        }
    }

    @PostMapping
    public ResultMessage<PermissionDTO> create(@Valid @RequestBody CreatePermissionRequest request) {
        try {
            return ResultUtil.data(roleAppService.createPermission(AuthControllerMapper.toCommand(request)));
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(400, e.getMessage());
        } catch (Exception e) {
            log.error("Create permission error", e);
            return ResultUtil.error(500, "Failed to create permission");
        }
    }

    @PutMapping("/{code}")
    public ResultMessage<PermissionDTO> update(@PathVariable String code, @Valid @RequestBody UpdatePermissionRequest request) {
        try {
            return ResultUtil.data(roleAppService.updatePermission(code, AuthControllerMapper.toCommand(request)));
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(400, e.getMessage());
        } catch (Exception e) {
            log.error("Update permission error", e);
            return ResultUtil.error(500, "Failed to update permission");
        }
    }

    @DeleteMapping("/{code}")
    public ResultMessage<Boolean> delete(@PathVariable String code) {
        try {
            roleAppService.deletePermission(code);
            return ResultUtil.data(true);
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(400, e.getMessage());
        } catch (Exception e) {
            log.error("Delete permission error", e);
            return ResultUtil.error(500, "Failed to delete permission");
        }
    }
}
