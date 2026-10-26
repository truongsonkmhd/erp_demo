package com.xxxx.ddd.infrastructure.persistence.mapper.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalendarEventJPAMapper extends JpaRepository<CalendarEvent, String> {
}
