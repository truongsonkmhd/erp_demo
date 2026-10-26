package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.vldc.VldcCollectionAppService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Bảng tin VLDC (tbl_news); endpoints from VldcCollectionController. */
@RestController
@RequestMapping("/api/vldc/news")
public class NewsController extends VldcCollectionController {
    public NewsController(VldcCollectionAppService service) {
        super("news", service);
    }
}
