package com.xxxx.ddd.infrastructure.persistence.mapper.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.DmsDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DmsDocumentJPAMapper extends JpaRepository<DmsDocument, String> {
    List<DmsDocument> findByProjectIdOrderByNameAsc(String projectId);
    boolean existsByFolderId(String folderId);
}
