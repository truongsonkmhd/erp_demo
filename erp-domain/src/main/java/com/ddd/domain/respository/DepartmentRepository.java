package com.xxxx.ddd.domain.respository;

import com.xxxx.ddd.domain.model.entity.Department;
import java.util.List;
import java.util.Optional;

public interface DepartmentRepository {
    List<Department> findAll();
    Optional<Department> findById(Long id);
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, Long id);
    long countRoles(Long id);
    Department save(Department department);
    void delete(Department department);
}
