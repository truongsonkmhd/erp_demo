package com.xxxx.ddd.domain.model.entity.hr;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

import java.time.LocalDate;

/** Chứng chỉ hành nghề / an toàn của một nhân sự; expiresAt null = không thời hạn. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_employee_certificate")
public class EmployeeCertificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 50)
    private String number;

    @Column(name = "issued_by", length = 200)
    private String issuedBy;

    @Column(name = "expires_at")
    private LocalDate expiresAt;
}
