package com.xxxx.ddd.domain.model.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.Accessors;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

@Data
@Accessors(chain = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tbl_user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String phone;

    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @ManyToMany
    @JoinTable(name = "tbl_user_role", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    @Column(name = "account_type", nullable = false)
    private Integer accountType = 2;

    @Column(name = "level_code", length = 50)
    private String levelCode;

    @Column(name = "base_salary")
    private BigDecimal baseSalary;

    private Boolean active = true;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Token token;

    /** In-memory catalog used so admin always has every permission without persisting a dirty Role. */
    @Transient
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Set<Permission> catalogPermissions;

    public Set<Permission> getEffectivePermissions() {
        if (roles.stream().anyMatch(Role::isAdmin)) {
            if (catalogPermissions != null && !catalogPermissions.isEmpty()) {
                return catalogPermissions;
            }
        }
        Set<Permission> effective = new LinkedHashSet<>();
        roles.forEach(role -> { if (role.getPermissions() != null) effective.addAll(role.getPermissions()); });
        return effective;
    }

    public String getRoleAuthority() {
        return roles.stream().findFirst().map(role -> "ROLE_" + role.getCode().trim().toUpperCase()).orElse("ROLE_USER");
    }

    public String getRoleCode() {
        return roles.stream().map(Role::getCode).sorted().findFirst().orElse(null);
    }
}
