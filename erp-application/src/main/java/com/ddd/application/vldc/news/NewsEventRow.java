package com.xxxx.ddd.application.vldc.news;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** NewsPost.event; only for "Sự kiện". */
@Data
public class NewsEventRow {
    @NotNull
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}")
    private String date;

    @NotNull
    @Size(max = 8)
    private String time;

    @NotNull
    @Size(max = 255)
    private String location;
}
