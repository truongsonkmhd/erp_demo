package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.model.PageDTO;
import com.xxxx.ddd.application.model.command.SaveProjectCommand;
import com.xxxx.ddd.application.model.work.PersonRefDTO;
import com.xxxx.ddd.application.model.work.ProjectDetailDTO;
import com.xxxx.ddd.application.model.work.ProjectSummaryDTO;
import com.xxxx.ddd.application.service.project.ProjectAppService;
import com.xxxx.ddd.controller.dto.DeleteRequestRequest;
import com.xxxx.ddd.controller.dto.NoteRequest;
import com.xxxx.ddd.controller.dto.SaveProjectRequest;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import com.xxxx.ddd.domain.model.enums.work.ProjectStatus;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Dự án (menu Nhiệm vụ / Dự án). Cần quyền xem trang; ai được lập, sửa, duyệt, xoá do ProjectAppService quyết theo đơn
 * vị và chức vụ (Phòng Kỹ thuật, Liên đoàn trưởng).
 */
@RestController
@RequestMapping("/api/vldc/projects")
@PreAuthorize("hasAuthority('vldc-projects:access')")
public class ProjectController {
    private final ProjectAppService projects;

    public ProjectController(ProjectAppService projects) {
        this.projects = projects;
    }

    @GetMapping
    public ResultMessage<PageDTO<ProjectSummaryDTO>> list(@RequestParam(required = false) ProjectStatus status,
                                                          @RequestParam(required = false) String keyword,
                                                          @RequestParam(defaultValue = "1") Integer pageNo,
                                                          @RequestParam(defaultValue = "10") Integer pageSize) {
        return ResultUtil.data(projects.list(status, keyword, pageNo, pageSize));
    }

    @GetMapping("/{code}")
    public ResultMessage<ProjectDetailDTO> detail(@PathVariable String code) {
        return ResultUtil.data(projects.detail(code));
    }

    @PostMapping
    public ResultMessage<ProjectDetailDTO> create(@Valid @RequestBody SaveProjectRequest request) {
        return ResultUtil.data(projects.create(toCommand(request)));
    }

    /** The code never changes: the one in the body is ignored. */
    @PutMapping("/{code}")
    public ResultMessage<ProjectDetailDTO> update(@PathVariable String code, @Valid @RequestBody SaveProjectRequest request) {
        return ResultUtil.data(projects.update(code, toCommand(request)));
    }

    @PostMapping("/{code}/approve")
    public ResultMessage<ProjectDetailDTO> approve(@PathVariable String code) {
        return ResultUtil.data(projects.approve(code));
    }

    @PostMapping("/{code}/reject")
    public ResultMessage<ProjectDetailDTO> reject(@PathVariable String code, @Valid @RequestBody NoteRequest request) {
        return ResultUtil.data(projects.reject(code, request.getNote()));
    }

    @PostMapping("/{code}/delete-requests")
    public ResultMessage<ProjectDetailDTO> requestDelete(@PathVariable String code, @Valid @RequestBody DeleteRequestRequest request) {
        return ResultUtil.data(projects.requestDelete(code, request.getReason()));
    }

    @PostMapping("/{code}/delete-requests/cancel")
    public ResultMessage<ProjectDetailDTO> cancelDelete(@PathVariable String code) {
        return ResultUtil.data(projects.cancelDelete(code));
    }

    @PostMapping("/{code}/delete-requests/approve")
    public ResultMessage<String> approveDelete(@PathVariable String code) {
        projects.approveDelete(code);
        return ResultUtil.data(code);
    }

    @PostMapping("/{code}/delete-requests/reject")
    public ResultMessage<ProjectDetailDTO> rejectDelete(@PathVariable String code, @Valid @RequestBody NoteRequest request) {
        return ResultUtil.data(projects.rejectDelete(code, request.getNote()));
    }

    @GetMapping("/{code}/assignable-users")
    public ResultMessage<List<PersonRefDTO>> assignableUsers(@PathVariable String code, @RequestParam Long departmentId) {
        return ResultUtil.data(projects.assignableUsers(code, departmentId));
    }

    private static SaveProjectCommand toCommand(SaveProjectRequest r) {
        SaveProjectCommand c = new SaveProjectCommand();
        c.setCode(r.getCode());
        c.setName(r.getName());
        c.setDescription(r.getDescription());
        c.setLeadDepartmentId(r.getLeadDepartmentId());
        c.setManagerUserId(r.getManagerUserId());
        c.setCoDepartmentIds(r.getCoDepartmentIds());
        c.setEstimatedBudget(r.getEstimatedBudget());
        c.setStartDate(r.getStartDate());
        c.setEndDate(r.getEndDate());
        c.setStatus(r.getStatus());
        return c;
    }
}
