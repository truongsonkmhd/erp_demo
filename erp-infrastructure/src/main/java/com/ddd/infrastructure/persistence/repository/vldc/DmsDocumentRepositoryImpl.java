package com.xxxx.ddd.infrastructure.persistence.repository.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.DmsDocument;
import com.xxxx.ddd.domain.respository.vldc.DmsDocumentRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.vldc.DmsDocumentJPAMapper;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class DmsDocumentRepositoryImpl implements DmsDocumentRepository {
    private final DmsDocumentJPAMapper jpa;

    public DmsDocumentRepositoryImpl(DmsDocumentJPAMapper jpa) {
        this.jpa = jpa;
    }

    public List<DmsDocument> findAll() { return jpa.findAll(Sort.by("projectId", "name")); }
    public List<DmsDocument> findByProjectId(String projectId) { return jpa.findByProjectIdOrderByNameAsc(projectId); }
    public Optional<DmsDocument> findById(String id) { return jpa.findById(id); }
    public boolean existsByFolderId(String folderId) { return jpa.existsByFolderId(folderId); }
    public DmsDocument save(DmsDocument document) { return jpa.save(document); }
    public void delete(DmsDocument document) { jpa.delete(document); }
}
