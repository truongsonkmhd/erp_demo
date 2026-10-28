package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.hr.SkillAppService;
import com.xxxx.ddd.application.hr.StaffSkillRow;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Skill matrix rows, with the VLDC collection contract; GET /catalog lists the skill columns. */
@RestController
@RequestMapping("/api/vldc/" + SkillAppService.COLLECTION)
public class StaffSkillController {
    private final SkillAppService service;

    public StaffSkillController(SkillAppService service) {
        this.service = service;
    }

    @GetMapping
    public ResultMessage<List<StaffSkillRow>> findAll() {
        return ResultUtil.data(service.findAll());
    }

    @GetMapping("/empty")
    public ResultMessage<Boolean> isEmpty() {
        return ResultUtil.data(false);
    }

    @GetMapping("/catalog")
    public ResultMessage<List<SkillAppService.SkillDTO>> catalog() {
        return ResultUtil.data(service.catalog());
    }

    @PutMapping("/{id}")
    public ResultMessage<StaffSkillRow> save(@PathVariable String id, @Valid @RequestBody StaffSkillRow row) {
        return ResultUtil.data(service.save(id, row));
    }
}
