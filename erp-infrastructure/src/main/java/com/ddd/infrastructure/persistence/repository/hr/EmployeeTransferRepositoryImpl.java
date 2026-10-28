package com.xxxx.ddd.infrastructure.persistence.repository.hr;

import com.xxxx.ddd.domain.model.entity.hr.EmployeeTransfer;
import com.xxxx.ddd.domain.respository.hr.EmployeeTransferRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.hr.EmployeeTransferJPAMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class EmployeeTransferRepositoryImpl implements EmployeeTransferRepository {
    private final EmployeeTransferJPAMapper mapper;

    public EmployeeTransferRepositoryImpl(EmployeeTransferJPAMapper mapper) { this.mapper = mapper; }

    public List<EmployeeTransfer> findByEmployee(Long employeeId) { return mapper.findByEmployeeIdOrderByEffectiveDateDescIdDesc(employeeId); }
    public EmployeeTransfer save(EmployeeTransfer transfer) { return mapper.save(transfer); }
}
