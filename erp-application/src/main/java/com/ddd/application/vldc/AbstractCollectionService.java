package com.xxxx.ddd.application.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.BaseRecord;
import com.xxxx.ddd.domain.respository.vldc.RecordRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Transactions are declared per data method: a class-level one would also wrap name()/rowType(). */
public abstract class AbstractCollectionService<D extends CollectionRow, E extends BaseRecord> implements CollectionService<D> {
    private final RecordRepository<E> repository;

    protected AbstractCollectionService(RecordRepository<E> repository) {
        this.repository = repository;
    }

    /** existing is null when the row is new; the returned entity must carry row.getId(). */
    protected abstract E toEntity(D row, E existing);

    protected abstract D toRow(E entity);

    @Transactional(readOnly = true)
    public List<D> findAll() {
        return repository.findAll().stream().map(this::toRow).toList();
    }

    @Transactional(readOnly = true)
    public boolean isEmpty() {
        return repository.isEmpty();
    }

    @Transactional
    public D upsert(D row, String actor) {
        E entity = toEntity(row, repository.findById(row.getId()).orElse(null));
        entity.setUpdatedBy(actor);
        return toRow(repository.save(entity));
    }

    @Transactional
    public int replaceAll(List<D> rows, String actor, boolean onlyIfEmpty) {
        Set<String> ids = new HashSet<>();
        for (D row : rows) {
            if (!ids.add(row.getId())) throw new IllegalArgumentException("Duplicate id: " + row.getId());
        }
        if (onlyIfEmpty && !repository.isEmpty()) throw new AccessDeniedException("Only admin can replace a non-empty collection");
        repository.deleteAll();
        List<E> entities = rows.stream().map(row -> {
            E entity = toEntity(row, null);
            entity.setUpdatedBy(actor);
            return entity;
        }).toList();
        return repository.saveAll(entities).size();
    }
}
