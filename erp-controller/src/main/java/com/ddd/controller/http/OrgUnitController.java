package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.hr.OrgUnitAppService;
import com.xxxx.ddd.application.hr.OrgUnitRow;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Đơn vị (Phòng ban page), with the VLDC collection contract; only existing units can be changed. */
@RestController
@RequestMapping("/api/vldc/" + OrgUnitAppService.ORG_UNITS)
public class OrgUnitController {
    private final OrgUnitAppService service;

    public OrgUnitController(OrgUnitAppService service) {
        this.service = service;
    }

    @GetMapping
    public ResultMessage<List<OrgUnitRow>> findAll() {
        return ResultUtil.data(service.units());
    }

    @GetMapping("/empty")
    public ResultMessage<Boolean> isEmpty() {
        return ResultUtil.data(false);
    }

    @PutMapping("/{id}")
    public ResultMessage<OrgUnitRow> upsert(@PathVariable String id, @Valid @RequestBody OrgUnitRow row) {
        return ResultUtil.data(service.saveUnit(id, row));
    }
}
