package com.xxxx.ddd.domain.respository.hr;

import com.xxxx.ddd.domain.model.entity.hr.Employee;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository {
    /** Every profile with its certificates and skills loaded (the list is small: one Liên đoàn). */
    List<Employee> findAllWithDetails();

    Optional<Employee> findByCode(String code);

    Optional<Employee> findById(Long id);

    Optional<Employee> findByUserId(Long userId);

    List<Employee> findByUserIds(Collection<Long> userIds);

    /** Working (not left) people in the given departments. */
    long countWorkingIn(Collection<Long> departmentIds);

    Employee save(Employee employee);
}
