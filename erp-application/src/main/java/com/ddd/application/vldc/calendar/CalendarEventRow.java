package com.xxxx.ddd.application.vldc.calendar;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.xxxx.ddd.application.vldc.CollectionRow;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Same shape as CalendarEvent in erp-frontend.com/src/features/vldc/data/types.ts. */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CalendarEventRow implements CollectionRow {
    @NotBlank
    private String id;

    /** dd/mm/yyyy, as vnDate() writes it. */
    @NotNull
    @Pattern(regexp = "\\d{2}/\\d{2}/\\d{4}")
    private String date;

    @NotNull
    @Pattern(regexp = "([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?")
    private String time;

    /** Room for the "[Đã gỡ] " / "Nhắc: " prefixes on a 500-character news title. */
    @NotBlank
    @Size(max = 600)
    private String title;

    @NotNull
    @Pattern(regexp = "federation|unit|project|personal")
    private String scope;

    /** Unit name (unit-scope visibility compares it with the viewer's unit). */
    @NotNull
    @Size(max = 255)
    private String unit;

    /** Project id, "-" when the entry is not for a project. */
    @NotNull
    @Size(max = 64)
    private String project;

    /** Role code of the creator; personal entries are visible only to it. */
    @NotBlank
    @Size(max = 64)
    private String owner;

    /** Engine page opened from the entry. */
    @NotNull
    @Size(max = 64)
    private String link;

    @NotNull
    @Size(max = 4000)
    private String note;

    /** Tổ/phòng (SubUnit id) inside unit when the entry is for one tổ. */
    @Size(max = 64)
    private String subUnit;
}
