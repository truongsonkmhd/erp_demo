package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.model.work.EquipmentRefDTO;
import com.xxxx.ddd.application.service.mission.EquipmentCatalog;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Danh mục thiết bị để chọn trên form Nhiệm vụ (chỉ đọc). */
@RestController
@RequestMapping("/api/vldc/equipment")
@PreAuthorize("hasAuthority('vldc-projects:access')")
public class EquipmentController {
    private final EquipmentCatalog catalog;

    public EquipmentController(EquipmentCatalog catalog) {
        this.catalog = catalog;
    }

    @GetMapping
    public ResultMessage<List<EquipmentRefDTO>> search(@RequestParam(required = false) String keyword) {
        return ResultUtil.data(catalog.search(keyword));
    }
}
