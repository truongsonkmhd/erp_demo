package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.hr.StaffAppService;
import com.xxxx.ddd.application.hr.StaffProfileRow;
import com.xxxx.ddd.application.hr.TransferDTO;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Hồ sơ nhân sự for the VLDC pages, same contract as a VLDC collection (GET, GET /empty, PUT /{id}) but stored in
 * tbl_employee; the data is seeded by migration, so /empty is always false and there is no replace-all.
 */
@RestController
@RequestMapping("/api/vldc/" + StaffAppService.COLLECTION)
public class StaffProfileController {
    private final StaffAppService service;

    public StaffProfileController(StaffAppService service) {
        this.service = service;
    }

    @GetMapping
    public ResultMessage<List<StaffProfileRow>> findAll() {
        return ResultUtil.data(service.findAll());
    }

    @GetMapping("/empty")
    public ResultMessage<Boolean> isEmpty() {
        return ResultUtil.data(false);
    }

    @PutMapping("/{id}")
    public ResultMessage<StaffProfileRow> upsert(@PathVariable String id, @Valid @RequestBody StaffProfileRow row) {
        return ResultUtil.data(service.upsert(id, row));
    }

    /** Điều chuyển history, newest first. */
    @GetMapping("/{id}/transfers")
    public ResultMessage<List<TransferDTO>> transfers(@PathVariable String id) {
        return ResultUtil.data(service.history(id));
    }
}
