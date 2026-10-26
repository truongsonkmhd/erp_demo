package com.xxxx.ddd.infrastructure.persistence.repository.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.CalendarEvent;
import com.xxxx.ddd.domain.respository.vldc.CalendarEventRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.vldc.CalendarEventJPAMapper;
import org.springframework.stereotype.Repository;

@Repository
public class CalendarEventRepositoryImpl extends JpaRecordRepository<CalendarEvent> implements CalendarEventRepository {
    public CalendarEventRepositoryImpl(CalendarEventJPAMapper mapper) {
        super(mapper);
    }
}
