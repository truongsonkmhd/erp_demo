package com.xxxx.ddd.application.vldc;

import java.util.List;

public interface CollectionService<D extends CollectionRow> {
    /** Same as the dataset's "collection" in erp-frontend.com/src/features/vldc/data/datasets.ts, e.g. "news". */
    String name();
    Class<D> rowType();
    List<D> findAll();
    D upsert(D row, String actor);
    /**
     * Deletes every row, then writes the given ones; returns how many were written. With onlyIfEmpty the
     * emptiness check runs in the same transaction and refuses (AccessDeniedException) a non-empty collection.
     */
    int replaceAll(List<D> rows, String actor, boolean onlyIfEmpty);
    boolean isEmpty();
}
