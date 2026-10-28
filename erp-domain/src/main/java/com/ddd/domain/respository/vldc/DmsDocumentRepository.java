package com.xxxx.ddd.domain.respository.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.DmsDocument;

import java.util.List;
import java.util.Optional;

public interface DmsDocumentRepository {
    List<DmsDocument> findAll();
    List<DmsDocument> findByProjectId(String projectId);
    Optional<DmsDocument> findById(String id);
    boolean existsByFolderId(String folderId);
    DmsDocument save(DmsDocument document);
    void delete(DmsDocument document);
}
