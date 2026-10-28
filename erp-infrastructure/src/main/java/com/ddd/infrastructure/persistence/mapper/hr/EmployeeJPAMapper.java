package com.xxxx.ddd.infrastructure.persistence.mapper.hr;

import com.xxxx.ddd.domain.model.entity.hr.Employee;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EmployeeJPAMapper extends JpaRepository<Employee, Long> {
    @EntityGraph(attributePaths = {"certificates", "skills"})
    @Query("SELECT DISTINCT e FROM Employee e ORDER BY e.code")
    List<Employee> findAllWithDetails();

    @EntityGraph(attributePaths = {"certificates", "skills"})
    Optional<Employee> findByCode(String code);

    Optional<Employee> findByUserId(Long userId);

    List<Employee> findByUserIdIn(Collection<Long> userIds);

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.id IN :ids AND e.status <> 'NGHI_VIEC'")
    long countWorkingIn(@Param("ids") Collection<Long> ids);
}
