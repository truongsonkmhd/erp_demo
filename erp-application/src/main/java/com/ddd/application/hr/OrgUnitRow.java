package com.xxxx.ddd.application.hr;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Đơn vị in the shape of the frontend OrgUnit. leader/deputy/staff/staffCount are derived (head and deputy
 * profiles, working people in the unit and its tổ); headId/deputyId are what a save changes.
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrgUnitRow {
    @NotBlank
    @Size(max = 50)
    private String id;

    @NotBlank
    @Size(max = 150)
    private String name;

    @Size(max = 50)
    private String type;

    private String leader;
    private String deputy;
    private String staff;
    private Integer staffCount;

    @Size(max = 2000)
    private String mission;

    private boolean isPublic = true;

    @Size(max = 20)
    private String headId;

    @Size(max = 20)
    private String deputyId;

    /** Kept as "public" in JSON like the frontend type. */
    @com.fasterxml.jackson.annotation.JsonProperty("public")
    public boolean isPublic() {
        return isPublic;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("public")
    public void setPublic(boolean value) {
        isPublic = value;
    }
}
