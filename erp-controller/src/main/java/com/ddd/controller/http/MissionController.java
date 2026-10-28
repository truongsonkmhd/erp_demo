package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.model.PageDTO;
import com.xxxx.ddd.application.model.command.SaveMissionCommand;
import com.xxxx.ddd.application.model.command.TaskProgressCommand;
import com.xxxx.ddd.application.model.work.MissionDetailDTO;
import com.xxxx.ddd.application.model.work.MissionSummaryDTO;
import com.xxxx.ddd.application.model.work.PersonRefDTO;
import com.xxxx.ddd.application.service.mission.MissionAppService;
import com.xxxx.ddd.controller.dto.CommentRequest;
import com.xxxx.ddd.controller.dto.NoteRequest;
import com.xxxx.ddd.controller.dto.SaveMissionRequest;
import com.xxxx.ddd.controller.dto.TaskProgressRequest;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import com.xxxx.ddd.domain.model.enums.work.MissionStatus;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Nhiệm vụ (tab Nhiệm vụ của menu Nhiệm vụ / Dự án): cấp dưới lập, cấp trên trực tiếp duyệt. Cần quyền xem trang; các
 * thao tác ghi cần thêm vldc-directives:update. Ai được làm gì với từng nhiệm vụ do MissionAppService quyết.
 */
@RestController
@RequestMapping("/api/vldc/missions")
@PreAuthorize("hasAuthority('vldc-projects:access')")
public class MissionController {
    // A method-level @PreAuthorize replaces the class one, so it repeats the page access.
    static final String UPDATE = "hasAuthority('vldc-projects:access') and hasAuthority('vldc-directives:update')";

    private final MissionAppService missions;

    public MissionController(MissionAppService missions) {
        this.missions = missions;
    }

    @GetMapping
    public ResultMessage<PageDTO<MissionSummaryDTO>> list(@RequestParam(required = false) MissionStatus status,
                                                          @RequestParam(required = false) String keyword,
                                                          @RequestParam(defaultValue = "1") Integer pageNo,
                                                          @RequestParam(defaultValue = "10") Integer pageSize) {
        return ResultUtil.data(missions.list(status, keyword, pageNo, pageSize));
    }

    /** Who approves the signed-in user's missions (shown on the form as "Người duyệt"); null for the federation head. */
    @GetMapping("/approver")
    public ResultMessage<PersonRefDTO> approver() {
        return ResultUtil.data(missions.approver());
    }

    @GetMapping("/{code}")
    public ResultMessage<MissionDetailDTO> detail(@PathVariable String code) {
        return ResultUtil.data(missions.detail(code));
    }

    @PostMapping
    @PreAuthorize(UPDATE)
    public ResultMessage<MissionDetailDTO> create(@Valid @RequestBody SaveMissionRequest r) {
        return ResultUtil.data(missions.create(toCommand(r)));
    }

    /** The code never changes: the one in the body is ignored. */
    @PutMapping("/{code}")
    @PreAuthorize(UPDATE)
    public ResultMessage<MissionDetailDTO> update(@PathVariable String code, @Valid @RequestBody SaveMissionRequest r) {
        return ResultUtil.data(missions.update(code, toCommand(r)));
    }

    @PostMapping("/{code}/approve")
    @PreAuthorize(UPDATE)
    public ResultMessage<MissionDetailDTO> approve(@PathVariable String code, @Valid @RequestBody(required = false) NoteRequest r) {
        return ResultUtil.data(missions.approve(code, note(r)));
    }

    @PostMapping("/{code}/reject")
    @PreAuthorize(UPDATE)
    public ResultMessage<MissionDetailDTO> reject(@PathVariable String code, @Valid @RequestBody(required = false) NoteRequest r) {
        return ResultUtil.data(missions.reject(code, note(r)));
    }

    @PostMapping("/{code}/progress")
    @PreAuthorize(UPDATE)
    public ResultMessage<MissionDetailDTO> progress(@PathVariable String code, @Valid @RequestBody TaskProgressRequest r) {
        TaskProgressCommand c = new TaskProgressCommand();
        c.setProgress(r.getProgress());
        c.setEvidence(r.getEvidence());
        c.setNote(r.getNote());
        return ResultUtil.data(missions.updateProgress(code, c));
    }

    @PostMapping("/{code}/complete")
    @PreAuthorize(UPDATE)
    public ResultMessage<MissionDetailDTO> complete(@PathVariable String code, @Valid @RequestBody(required = false) NoteRequest r) {
        return ResultUtil.data(missions.complete(code, note(r)));
    }

    @PostMapping("/{code}/comments")
    @PreAuthorize(UPDATE)
    public ResultMessage<MissionDetailDTO> comment(@PathVariable String code, @Valid @RequestBody CommentRequest r) {
        return ResultUtil.data(missions.comment(code, r.getContent()));
    }

    @DeleteMapping("/{code}")
    @PreAuthorize(UPDATE)
    public ResultMessage<String> delete(@PathVariable String code) {
        missions.delete(code);
        return ResultUtil.data(code);
    }

    private static SaveMissionCommand toCommand(SaveMissionRequest r) {
        SaveMissionCommand c = new SaveMissionCommand();
        c.setCode(r.getCode());
        c.setTitle(r.getTitle());
        c.setDepartmentId(r.getDepartmentId());
        c.setProjectCode(r.getProjectCode());
        c.setDueDate(r.getDueDate());
        c.setEquipmentIds(r.getEquipmentIds());
        c.setContent(r.getContent());
        c.setFollowerUserIds(r.getFollowerUserIds());
        return c;
    }

    private static String note(NoteRequest r) {
        return r == null ? null : r.getNote();
    }
}
