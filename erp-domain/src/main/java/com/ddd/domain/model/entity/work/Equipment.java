package com.xxxx.ddd.domain.model.entity.work;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** Một thiết bị trong danh mục (form Nhiệm vụ chọn từ đây). Bảng tối thiểu, gộp vào module tài sản khi có. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_equipment")
public class Equipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, length = 30)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
