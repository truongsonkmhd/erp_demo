package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.model.OrgDirectoryDTO;
import com.xxxx.ddd.application.model.OrgPersonDTO;
import com.xxxx.ddd.application.model.PositionDTO;
import com.xxxx.ddd.application.service.org.OrgAppService;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Tổ chức: chức vụ, cây đơn vị và phạm vi giao việc. Permission (vldc-directives:create) quyết định có được giao việc
 * không; AuthorizationService quyết định được giao cho ai.
 */
@RestController
@RequestMapping("/api/org")
public class OrgController {
    static final String ASSIGN = "hasAuthority('vldc-directives:create')";

    private final OrgAppService orgAppService;

    public OrgController(OrgAppService orgAppService) {
        this.orgAppService = orgAppService;
    }

    /** Signed-in users: who holds which position in which unit (no account or salary data). */
    @GetMapping("/directory")
    public ResultMessage<OrgDirectoryDTO> directory() {
        return ResultUtil.data(orgAppService.directory());
    }

    @GetMapping("/positions")
    public ResultMessage<List<PositionDTO>> positions() {
        return ResultUtil.data(orgAppService.positions());
    }

    /** People the caller may assign work to: needs the assign permission and is limited to the managed scope. */
    @GetMapping("/assignees")
    @PreAuthorize(ASSIGN)
    public ResultMessage<List<OrgPersonDTO>> assignees() {
        return ResultUtil.data(orgAppService.assignees());
    }

    /** 200 when the caller may assign work to the user, 403 otherwise. */
    @GetMapping("/assignees/{userId}/check")
    @PreAuthorize(ASSIGN)
    public ResultMessage<Long> checkAssignee(@PathVariable Long userId) {
        orgAppService.requireCanAssign(userId);
        return ResultUtil.data(userId);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResultMessage<?> badRequest(IllegalArgumentException error) {
        return ResultUtil.error(400, error.getMessage());
    }
}
