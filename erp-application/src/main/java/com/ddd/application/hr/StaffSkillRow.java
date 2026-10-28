package com.xxxx.ddd.application.hr;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * One row of the skill matrix in the shape of the frontend StaffSkill: id is the StaffProfile id, unit the unit name.
 * geophysics/gis/data/pm mirror levels for the four original skills (0 = not assessed); levels holds every skill.
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StaffSkillRow {
    @NotBlank
    private String id;

    private String name;
    private String unit;

    @Min(0) @Max(5) private Integer geophysics;
    @Min(0) @Max(5) private Integer gis;
    @Min(0) @Max(5) private Integer data;
    @Min(0) @Max(5) private Integer pm;

    private boolean onField;

    /** Nearest certificate expiry, yyyy-mm-dd ("" when none). */
    private String certExpiry;

    private Map<String, Integer> levels = new LinkedHashMap<>();
}
