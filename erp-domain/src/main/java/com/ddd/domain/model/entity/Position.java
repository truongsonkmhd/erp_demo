package com.xxxx.ddd.domain.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.experimental.Accessors;

/**
 * Chức vụ/cấp bậc trong tổ chức, tách khỏi Role (nhóm quyền chức năng). Level 1 là cấp cao nhất.
 * managesUnit: người giữ chức vụ quản lý đơn vị của mình và các đơn vị con.
 */
@Data
@Accessors(chain = true)
@Entity
@Table(name = "tbl_position")
public class Position {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false)
    private Integer level;

    @Column(name = "manages_unit", nullable = false)
    private Boolean managesUnit = false;
}
