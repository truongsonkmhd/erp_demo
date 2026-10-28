package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.hr.*;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Tài khoản page of VLDC: accounts tied to hồ sơ nhân sự (vldc-accounts:access / create / update). */
@RestController
@RequestMapping("/api/hr/accounts")
public class HrAccountController {
    private final AccountAppService service;

    public HrAccountController(AccountAppService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'vldc-accounts:access')")
    public ResultMessage<List<AccountDTO>> list() {
        return ResultUtil.data(service.list());
    }

    @GetMapping("/options")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'vldc-accounts:access')")
    public ResultMessage<AccountOptionsDTO> options() {
        return ResultUtil.data(service.options());
    }

    /** Returns the one-time password to hand over. */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'vldc-accounts:create')")
    public ResultMessage<AccountSecretDTO> create(@Valid @RequestBody CreateAccountCommand command) {
        return ResultUtil.data(service.create(command));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'vldc-accounts:update')")
    public ResultMessage<AccountDTO> update(@PathVariable Long id, @Valid @RequestBody UpdateAccountCommand command) {
        return ResultUtil.data(service.update(id, command));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'vldc-accounts:update')")
    public ResultMessage<AccountSecretDTO> resetPassword(@PathVariable Long id) {
        return ResultUtil.data(service.resetPassword(id));
    }
}
