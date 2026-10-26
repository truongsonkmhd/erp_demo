package com.xxxx.ddd.application.vldc.calendar;

import com.xxxx.ddd.application.vldc.AbstractCollectionService;
import com.xxxx.ddd.domain.model.entity.vldc.CalendarEvent;
import com.xxxx.ddd.domain.respository.vldc.CalendarEventRepository;
import org.springframework.stereotype.Service;

@Service
public class CalendarEventCollectionService extends AbstractCollectionService<CalendarEventRow, CalendarEvent> {

    public CalendarEventCollectionService(CalendarEventRepository repository) {
        super(repository);
    }

    public String name() { return "calendar_events"; }

    public Class<CalendarEventRow> rowType() { return CalendarEventRow.class; }

    protected CalendarEvent toEntity(CalendarEventRow row, CalendarEvent existing) {
        CalendarEvent event = existing != null ? existing : new CalendarEvent();
        event.setId(row.getId());
        return event.setEventDate(row.getDate())
                .setEventTime(row.getTime())
                .setTitle(row.getTitle())
                .setScope(row.getScope())
                .setUnit(row.getUnit())
                .setProject(row.getProject())
                .setOwner(row.getOwner())
                .setLink(row.getLink())
                .setNote(row.getNote())
                .setSubUnit(row.getSubUnit());
    }

    protected CalendarEventRow toRow(CalendarEvent event) {
        CalendarEventRow row = new CalendarEventRow();
        row.setId(event.getId());
        row.setDate(event.getEventDate());
        row.setTime(event.getEventTime());
        row.setTitle(event.getTitle());
        row.setScope(event.getScope());
        row.setUnit(event.getUnit());
        row.setProject(event.getProject());
        row.setOwner(event.getOwner());
        row.setLink(event.getLink());
        row.setNote(event.getNote());
        row.setSubUnit(event.getSubUnit());
        return row;
    }
}
