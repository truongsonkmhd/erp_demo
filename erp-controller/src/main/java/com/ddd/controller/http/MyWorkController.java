package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.model.work.MyWorkDTO;
import com.xxxx.ddd.application.service.mywork.MyWorkAppService;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Menu Công việc (chỉ đọc): việc từ Dự án, Việc dự án và Nhiệm vụ, gom thành thư mục dự án và nhiệm vụ đứng riêng; phân
 * trang theo mục. Xử lý việc vẫn gọi API của từng nguồn.
 */
@RestController
@RequestMapping("/api/vldc/my-work")
@PreAuthorize("hasAuthority('vldc-action:access')")
public class MyWorkController {
    private final MyWorkAppService myWork;

    public MyWorkController(MyWorkAppService myWork) {
        this.myWork = myWork;
    }

    /** Tab Của tôi. filter: mine (mặc định), overdue, today, cc, all. */
    @GetMapping
    public ResultMessage<MyWorkDTO> mine(@RequestParam(defaultValue = "mine") String filter,
                                         @RequestParam(required = false) String keyword,
                                         @RequestParam(defaultValue = "1") Integer pageNo,
                                         @RequestParam(defaultValue = "10") Integer pageSize) {
        return ResultUtil.data(myWork.mine(filter, keyword, pageNo, pageSize));
    }

    /** Tab Toàn Liên đoàn (Liên đoàn trưởng). status: IN_PROGRESS, OVERDUE, AT_RISK, PENDING. */
    @GetMapping("/federation")
    public ResultMessage<MyWorkDTO> federation(@RequestParam(required = false) String status,
                                               @RequestParam(required = false) Long departmentId,
                                               @RequestParam(required = false) String keyword,
                                               @RequestParam(defaultValue = "1") Integer pageNo,
                                               @RequestParam(defaultValue = "10") Integer pageSize) {
        return ResultUtil.data(myWork.federation(status, departmentId, keyword, pageNo, pageSize));
    }
}
