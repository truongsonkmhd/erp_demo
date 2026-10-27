package com.xxxx.ddd.domain.respository.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.CalendarEvent;

import java.time.LocalDateTime;
import java.util.List;

public interface CalendarEventRepository extends RecordRepository<CalendarEvent> {
    /** Entries with from < startsAt <= to, earliest first. */
    List<CalendarEvent> findStartingBetween(LocalDateTime from, LocalDateTime to);
}
