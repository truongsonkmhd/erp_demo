package com.xxxx.ddd.domain.model.entity.hr;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** Danh mục kỹ năng của skill matrix. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_skill")
public class Skill {
    @Id
    @Column(length = 30)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(nullable = false)
    private Boolean active = true;
}
