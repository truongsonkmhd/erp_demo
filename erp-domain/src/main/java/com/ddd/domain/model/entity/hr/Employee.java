package com.xxxx.ddd.domain.model.entity.hr;

import com.xxxx.ddd.domain.model.entity.Department;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Hồ sơ nhân sự, tách khỏi tài khoản đăng nhập (tbl_user): một người có thể chưa có tài khoản, và tài khoản bị khoá
 * khi người đó nghỉ việc. department là đơn vị hoặc tổ/phòng đang công tác.
 */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_employee")
public class Employee {
    public static final String WORKING = "DANG_LAM";
    public static final String SUSPENDED = "TAM_NGHI";
    public static final String LEFT = "NGHI_VIEC";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã nhân sự, ví dụ NS-001; là id của hồ sơ phía giao diện. */
    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(length = 10)
    private String gender;

    @Column(name = "birth_year", nullable = false)
    private Integer birthYear;

    @Column(length = 20)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(nullable = false, length = 30)
    private String education;

    @Column(nullable = false, length = 150)
    private String major;

    /** Năm bắt đầu công tác; số năm kinh nghiệm tính từ đây. */
    @Column(name = "work_start_year", nullable = false)
    private Integer workStartYear;

    @Column(nullable = false, length = 100)
    private String title;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(name = "on_field", nullable = false)
    private boolean onField;

    @Column(nullable = false, length = 20)
    private String status = WORKING;

    @Column(name = "left_at")
    private LocalDate leftAt;

    @Column(name = "user_id", unique = true)
    private Long userId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("expiresAt ASC")
    private Set<EmployeeCertificate> certificates = new LinkedHashSet<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<EmployeeSkill> skills = new LinkedHashSet<>();

    public boolean hasLeft() {
        return LEFT.equals(status);
    }
}
