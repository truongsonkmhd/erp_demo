package com.xxxx.ddd.infrastructure.persistence.repository.hr;

import com.xxxx.ddd.domain.model.entity.hr.Employee;
import com.xxxx.ddd.domain.respository.hr.EmployeeRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.hr.EmployeeJPAMapper;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public class EmployeeRepositoryImpl implements EmployeeRepository {
    private final EmployeeJPAMapper mapper;

    public EmployeeRepositoryImpl(EmployeeJPAMapper mapper) { this.mapper = mapper; }

    public List<Employee> findAllWithDetails() { return mapper.findAllWithDetails(); }
    public Optional<Employee> findByCode(String code) { return mapper.findByCode(code); }
    public Optional<Employee> findById(Long id) { return mapper.findById(id); }
    public Optional<Employee> findByUserId(Long userId) { return mapper.findByUserId(userId); }
    public List<Employee> findByUserIds(Collection<Long> userIds) { return userIds.isEmpty() ? List.of() : mapper.findByUserIdIn(userIds); }
    public long countWorkingIn(Collection<Long> departmentIds) { return departmentIds.isEmpty() ? 0 : mapper.countWorkingIn(departmentIds); }
    public Employee save(Employee employee) { return mapper.save(employee); }
}
