package com.xxxx.ddd.domain.respository.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.CashEntry;

import java.util.List;
import java.util.Optional;

public interface CashEntryRepository {
    List<CashEntry> findAll();
    Optional<CashEntry> findById(String id);
    CashEntry save(CashEntry entity);
    void delete(CashEntry entity);
}
