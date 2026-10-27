package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.vldc.VldcCollectionAppService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Đề tài KH-CN & Đổi mới (tbl_science_topic); endpoints from VldcCollectionController, rows filtered by unit scope. */
@RestController
@RequestMapping("/api/vldc/science_topics")
public class ScienceTopicController extends VldcCollectionController {
    public ScienceTopicController(VldcCollectionAppService service) {
        super("science_topics", service);
    }
}
