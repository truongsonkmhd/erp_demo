package com.xxxx.ddd.infrastructure.persistence.repository.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.Contract;
import com.xxxx.ddd.domain.respository.vldc.ContractRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.vldc.ContractJPAMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ContractRepositoryImpl implements ContractRepository {
    private final ContractJPAMapper jpa;

    public ContractRepositoryImpl(ContractJPAMapper jpa) {
        this.jpa = jpa;
    }

    public List<Contract> findAll() { return jpa.findAll(); }
    public Optional<Contract> findById(String id) { return jpa.findById(id); }
    public Contract save(Contract entity) { return jpa.save(entity); }
    public void delete(Contract entity) { jpa.delete(entity); }
}
