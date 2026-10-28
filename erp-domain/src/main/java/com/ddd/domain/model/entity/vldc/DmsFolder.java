package com.xxxx.ddd.domain.model.entity.vldc;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** DMS folder of a project (level 1–3); unit is the UnitCode owning the project, i.e. who may see it. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_dms_folder")
public class DmsFolder extends BaseRecord {
    public static final int MAX_LEVEL = 3;

    @Column(name = "project_id", nullable = false, length = 64)
    private String projectId;

    @Column(nullable = false, length = 16)
    private String unit;

    /** Null for a top-level folder. */
    @Column(name = "parent_id", length = 64)
    private String parentId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false)
    private int level;

    /** Username of the creator (may delete it, with the unit head and admin). */
    @Column(name = "created_by")
    private String createdBy;
}
