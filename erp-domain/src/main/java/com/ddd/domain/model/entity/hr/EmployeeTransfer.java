package com.xxxx.ddd.domain.model.entity.hr;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Một lần điều chuyển giữa các đơn vị / tổ; fromDepartmentId null khi là lần tiếp nhận. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_employee_transfer")
public class EmployeeTransfer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "from_department_id")
    private Long fromDepartmentId;

    @Column(name = "to_department_id", nullable = false)
    private Long toDepartmentId;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(length = 500)
    private String note;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
