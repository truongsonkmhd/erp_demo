package com.xxxx.ddd.application.hr;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Tổ/phòng in the shape of the frontend SubUnit; headId is a StaffProfile id. Dissolved ones keep active=false. */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubUnitRow {
    @NotBlank
    @Pattern(regexp = "[A-Za-z0-9_.-]{1,50}")
    private String id;

    @NotBlank
    @Size(max = 50)
    private String unit;

    @NotBlank
    @Size(max = 150)
    private String name;

    @NotBlank
    private String kind;

    @Size(max = 2000)
    private String duty;

    @Size(max = 20)
    private String headId;

    private boolean active = true;

    private String createdAt;
    private String dissolvedAt;
}
