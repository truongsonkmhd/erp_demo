package com.xxxx.ddd.domain.respository.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.Contract;

import java.util.List;
import java.util.Optional;

public interface ContractRepository {
    List<Contract> findAll();
    Optional<Contract> findById(String id);
    Contract save(Contract entity);
    void delete(Contract entity);
}
