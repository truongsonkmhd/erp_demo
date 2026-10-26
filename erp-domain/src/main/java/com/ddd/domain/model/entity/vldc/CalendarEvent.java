package com.xxxx.ddd.domain.model.entity.vldc;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** Lịch làm việc entry (collection "calendar_events"). Date and time stay the strings the frontend sends. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_calendar_event")
public class CalendarEvent extends BaseRecord {
    /** dd/mm/yyyy. */
    @Column(name = "event_date", nullable = false, length = 10)
    private String eventDate;

    @Column(name = "event_time", nullable = false, length = 8)
    private String eventTime;

    @Column(nullable = false, length = 600)
    private String title;

    @Column(nullable = false, length = 16)
    private String scope;

    @Column(nullable = false)
    private String unit;

    @Column(nullable = false, length = 64)
    private String project;

    @Column(nullable = false, length = 64)
    private String owner;

    @Column(nullable = false, length = 64)
    private String link;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String note;

    @Column(name = "sub_unit", length = 64)
    private String subUnit;
}
