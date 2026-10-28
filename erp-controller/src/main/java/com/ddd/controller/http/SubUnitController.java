package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.hr.OrgUnitAppService;
import com.xxxx.ddd.application.hr.SubUnitRow;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Tổ/phòng (children of a đơn vị in tbl_department), with the VLDC collection contract. */
@RestController
@RequestMapping("/api/vldc/" + OrgUnitAppService.SUB_UNITS)
public class SubUnitController {
    private final OrgUnitAppService service;

    public SubUnitController(OrgUnitAppService service) {
        this.service = service;
    }

    @GetMapping
    public ResultMessage<List<SubUnitRow>> findAll() {
        return ResultUtil.data(service.subUnits());
    }

    @GetMapping("/empty")
    public ResultMessage<Boolean> isEmpty() {
        return ResultUtil.data(false);
    }

    @PutMapping("/{id}")
    public ResultMessage<SubUnitRow> upsert(@PathVariable String id, @Valid @RequestBody SubUnitRow row) {
        return ResultUtil.data(service.saveSubUnit(id, row));
    }
}
