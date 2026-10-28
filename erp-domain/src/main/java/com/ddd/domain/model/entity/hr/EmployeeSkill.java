package com.xxxx.ddd.domain.model.entity.hr;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.time.LocalDateTime;

/** Mức 1–5 của một nhân sự ở một kỹ năng (skill matrix). */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_employee_skill")
@IdClass(EmployeeSkill.Key.class)
public class EmployeeSkill {
    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Id
    @Column(name = "skill_code", nullable = false, length = 30)
    private String skillCode;

    @Column(nullable = false)
    private Integer level;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Getter
    @Setter
    @NoArgsConstructor
    @EqualsAndHashCode
    public static class Key implements Serializable {
        private Long employee;
        private String skillCode;
    }
}
