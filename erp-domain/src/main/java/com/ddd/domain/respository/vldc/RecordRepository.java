package com.xxxx.ddd.domain.respository.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.BaseRecord;

import java.util.List;
import java.util.Optional;

public interface RecordRepository<E extends BaseRecord> {
    /** Sorted by id ascending. */
    List<E> findAll();
    Optional<E> findById(String id);
    E save(E entity);
    List<E> saveAll(List<E> entities);
    /** Hard-deletes every row in one statement (bypasses JPA cascade: child tables need ON DELETE CASCADE). */
    void deleteAll();
    boolean isEmpty();
}
