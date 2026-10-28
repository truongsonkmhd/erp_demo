package com.xxxx.ddd.domain.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Entity
@Table(name = "tbl_department")
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String description;

    /** Đơn vị cha; null ở cấp gốc. */
    @Column(name = "parent_id")
    private Long parentId;

    /** DON_VI (đơn vị) hoặc tổ/phòng bên trong một đơn vị: PHONG, TO, DOI, XUONG, BO_PHAN. */
    @Column(nullable = false, length = 20)
    private String kind = KIND_UNIT;

    /** Nhóm đơn vị hiển thị: Điều hành, Bộ máy giúp việc, Đơn vị trực thuộc. */
    @Column(name = "unit_type", length = 50)
    private String unitType;

    /** Chức năng nhiệm vụ của đơn vị, hoặc nhiệm vụ của tổ. */
    @Column(length = 2000)
    private String mission;

    @Column(name = "head_employee_id")
    private Long headEmployeeId;

    @Column(name = "deputy_employee_id")
    private Long deputyEmployeeId;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /** false = tổ đã giải thể (giữ lại cho lịch sử). */
    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "dissolved_at")
    private LocalDateTime dissolvedAt;

    public static final String KIND_UNIT = "DON_VI";

    public boolean isUnit() {
        return KIND_UNIT.equals(kind);
    }
}
