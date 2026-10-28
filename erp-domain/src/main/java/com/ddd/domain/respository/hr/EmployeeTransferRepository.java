package com.xxxx.ddd.domain.respository.hr;

import com.xxxx.ddd.domain.model.entity.hr.EmployeeTransfer;

import java.util.List;

public interface EmployeeTransferRepository {
    /** Newest first. */
    List<EmployeeTransfer> findByEmployee(Long employeeId);

    EmployeeTransfer save(EmployeeTransfer transfer);
}
