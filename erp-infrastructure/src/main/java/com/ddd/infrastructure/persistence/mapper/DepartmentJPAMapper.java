package com.xxxx.ddd.infrastructure.persistence.mapper;

import com.xxxx.ddd.domain.model.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentJPAMapper extends JpaRepository<Department, Long> {
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, Long id);
}
