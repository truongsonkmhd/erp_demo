package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.model.PageDTO;
import com.xxxx.ddd.application.model.command.CreateTaskCommand;
import com.xxxx.ddd.application.model.command.TaskProgressCommand;
import com.xxxx.ddd.application.model.work.TaskDetailDTO;
import com.xxxx.ddd.application.model.work.TaskSummaryDTO;
import com.xxxx.ddd.application.service.task.ProjectTaskAppService;
import com.xxxx.ddd.controller.dto.CommentRequest;
import com.xxxx.ddd.controller.dto.CreateTaskRequest;
import com.xxxx.ddd.controller.dto.MoveTaskRequest;
import com.xxxx.ddd.controller.dto.NoteRequest;
import com.xxxx.ddd.controller.dto.TaskProgressRequest;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import com.xxxx.ddd.domain.model.enums.work.TaskStatus;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Việc trong dự án (Board / Danh sách của dự án; Dự án → Việc). Cần quyền xem trang; giao việc cần
 * vldc-directives:create (trưởng phòng), các thao tác khác vldc-directives:update. Ai được làm gì với từng việc do
 * ProjectTaskAppService quyết.
 */
@RestController
@RequestMapping("/api/vldc/project-tasks")
@PreAuthorize("hasAuthority('vldc-projects:access')")
public class ProjectTaskController {
    // A method-level @PreAuthorize replaces the class one, so each repeats the page access.
    static final String CREATE = "hasAuthority('vldc-projects:access') and hasAuthority('vldc-directives:create')";
    static final String UPDATE = "hasAuthority('vldc-projects:access') and hasAuthority('vldc-directives:update')";

    private final ProjectTaskAppService tasks;

    public ProjectTaskController(ProjectTaskAppService tasks) {
        this.tasks = tasks;
    }

    @GetMapping
    public ResultMessage<PageDTO<TaskSummaryDTO>> list(@RequestParam String projectCode,
                                                       @RequestParam(required = false) TaskStatus status,
                                                       @RequestParam(required = false) String keyword,
                                                       @RequestParam(defaultValue = "1") Integer pageNo,
                                                       @RequestParam(defaultValue = "10") Integer pageSize) {
        return ResultUtil.data(tasks.list(projectCode, status, keyword, pageNo, pageSize));
    }

    @GetMapping("/{code}")
    public ResultMessage<TaskDetailDTO> detail(@PathVariable String code) {
        return ResultUtil.data(tasks.detail(code));
    }

    /** Trưởng phòng của đơn vị tham gia dự án giao việc cho nhân viên đơn vị mình (checked by the service). */
    @PostMapping
    @PreAuthorize(CREATE)
    public ResultMessage<TaskDetailDTO> create(@Valid @RequestBody CreateTaskRequest r) {
        CreateTaskCommand c = new CreateTaskCommand();
        c.setCode(r.getCode());
        c.setProjectCode(r.getProjectCode());
        c.setTitle(r.getTitle());
        c.setResultRequirement(r.getResultRequirement());
        c.setComplexity(r.getComplexity());
        c.setAssigneeUserId(r.getAssigneeUserId());
        c.setFollowerUserIds(r.getFollowerUserIds());
        c.setDueDate(r.getDueDate());
        return ResultUtil.data(tasks.create(c));
    }

    @PostMapping("/{code}/accept")
    @PreAuthorize(UPDATE)
    public ResultMessage<TaskDetailDTO> accept(@PathVariable String code, @Valid @RequestBody(required = false) NoteRequest r) {
        return ResultUtil.data(tasks.accept(code, note(r)));
    }

    @PostMapping("/{code}/progress")
    @PreAuthorize(UPDATE)
    public ResultMessage<TaskDetailDTO> progress(@PathVariable String code, @Valid @RequestBody TaskProgressRequest r) {
        TaskProgressCommand c = new TaskProgressCommand();
        c.setProgress(r.getProgress());
        c.setEvidence(r.getEvidence());
        c.setNote(r.getNote());
        return ResultUtil.data(tasks.updateProgress(code, c));
    }

    @PostMapping("/{code}/submit")
    @PreAuthorize(UPDATE)
    public ResultMessage<TaskDetailDTO> submit(@PathVariable String code, @Valid @RequestBody(required = false) NoteRequest r) {
        return ResultUtil.data(tasks.submit(code, note(r)));
    }

    @PostMapping("/{code}/approve")
    @PreAuthorize(UPDATE)
    public ResultMessage<TaskDetailDTO> approve(@PathVariable String code, @Valid @RequestBody(required = false) NoteRequest r) {
        return ResultUtil.data(tasks.approve(code, note(r)));
    }

    @PostMapping("/{code}/return")
    @PreAuthorize(UPDATE)
    public ResultMessage<TaskDetailDTO> returnTask(@PathVariable String code, @Valid @RequestBody(required = false) NoteRequest r) {
        return ResultUtil.data(tasks.returnTask(code, note(r)));
    }

    @PostMapping("/{code}/move")
    @PreAuthorize(UPDATE)
    public ResultMessage<TaskDetailDTO> move(@PathVariable String code, @Valid @RequestBody MoveTaskRequest r) {
        return ResultUtil.data(tasks.move(code, r.getToStatus()));
    }

    @PostMapping("/{code}/comments")
    @PreAuthorize(UPDATE)
    public ResultMessage<TaskDetailDTO> comment(@PathVariable String code, @Valid @RequestBody CommentRequest r) {
        return ResultUtil.data(tasks.comment(code, r.getContent()));
    }

    @DeleteMapping("/{code}")
    @PreAuthorize(UPDATE)
    public ResultMessage<String> delete(@PathVariable String code) {
        tasks.delete(code);
        return ResultUtil.data(code);
    }

    private static String note(NoteRequest r) {
        return r == null ? null : r.getNote();
    }
}
