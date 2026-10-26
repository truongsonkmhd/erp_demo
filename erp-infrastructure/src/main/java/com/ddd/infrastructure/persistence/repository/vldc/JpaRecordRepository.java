package com.xxxx.ddd.infrastructure.persistence.repository.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.BaseRecord;
import com.xxxx.ddd.domain.respository.vldc.RecordRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public abstract class JpaRecordRepository<E extends BaseRecord> implements RecordRepository<E> {
    private final JpaRepository<E, String> jpa;

    protected JpaRecordRepository(JpaRepository<E, String> jpa) {
        this.jpa = jpa;
    }

    public List<E> findAll() { return jpa.findAll(Sort.by("id")); }
    public Optional<E> findById(String id) { return jpa.findById(id); }
    public E save(E entity) { return jpa.save(entity); }
    public List<E> saveAll(List<E> entities) { return jpa.saveAll(entities); }
    public void deleteAll() { jpa.deleteAllInBatch(); }
    public boolean isEmpty() { return jpa.count() == 0; }
}
