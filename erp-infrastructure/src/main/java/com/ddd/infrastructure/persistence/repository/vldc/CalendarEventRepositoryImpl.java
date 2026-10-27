package com.xxxx.ddd.infrastructure.persistence.repository.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.CalendarEvent;
import com.xxxx.ddd.domain.respository.vldc.CalendarEventRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.vldc.CalendarEventJPAMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public class CalendarEventRepositoryImpl extends JpaRecordRepository<CalendarEvent> implements CalendarEventRepository {
    private final CalendarEventJPAMapper mapper;

    public CalendarEventRepositoryImpl(CalendarEventJPAMapper mapper) {
        super(mapper);
        this.mapper = mapper;
    }

    public List<CalendarEvent> findStartingBetween(LocalDateTime from, LocalDateTime to) {
        return mapper.findStartingBetween(from, to);
    }
}
