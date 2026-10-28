package com.xxxx.ddd.infrastructure.persistence.repository.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.CashEntry;
import com.xxxx.ddd.domain.respository.vldc.CashEntryRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.vldc.CashEntryJPAMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class CashEntryRepositoryImpl implements CashEntryRepository {
    private final CashEntryJPAMapper jpa;

    public CashEntryRepositoryImpl(CashEntryJPAMapper jpa) {
        this.jpa = jpa;
    }

    public List<CashEntry> findAll() { return jpa.findAll(); }
    public Optional<CashEntry> findById(String id) { return jpa.findById(id); }
    public CashEntry save(CashEntry entity) { return jpa.save(entity); }
    public void delete(CashEntry entity) { jpa.delete(entity); }
}
