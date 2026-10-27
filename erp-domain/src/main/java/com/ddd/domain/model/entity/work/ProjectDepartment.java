package com.xxxx.ddd.domain.model.entity.work;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** Đơn vị phối hợp của dự án (đơn vị chủ trì ở Project.leadDepartmentId). */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_project_department")
public class ProjectDepartment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "department_id", nullable = false)
    private Long departmentId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
