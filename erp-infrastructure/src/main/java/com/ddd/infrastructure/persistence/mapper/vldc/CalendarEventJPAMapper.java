package com.xxxx.ddd.infrastructure.persistence.mapper.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CalendarEventJPAMapper extends JpaRepository<CalendarEvent, String> {
    @Query("SELECT e FROM CalendarEvent e WHERE e.startsAt > :from AND e.startsAt <= :to ORDER BY e.startsAt")
    List<CalendarEvent> findStartingBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
