package com.xxxx.ddd.infrastructure.persistence.mapper.hr;

import com.xxxx.ddd.domain.model.entity.hr.EmployeeTransfer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmployeeTransferJPAMapper extends JpaRepository<EmployeeTransfer, Long> {
    List<EmployeeTransfer> findByEmployeeIdOrderByEffectiveDateDescIdDesc(Long employeeId);
}
