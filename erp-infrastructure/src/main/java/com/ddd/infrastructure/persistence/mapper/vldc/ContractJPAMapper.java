package com.xxxx.ddd.infrastructure.persistence.mapper.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.Contract;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContractJPAMapper extends JpaRepository<Contract, String> {
}
