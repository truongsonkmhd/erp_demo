package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.vldc.VldcCollectionAppService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Lịch làm việc VLDC (tbl_calendar_event); endpoints from VldcCollectionController. */
@RestController
@RequestMapping("/api/vldc/calendar_events")
public class CalendarEventController extends VldcCollectionController {
    public CalendarEventController(VldcCollectionAppService service) {
        super("calendar_events", service);
    }
}
