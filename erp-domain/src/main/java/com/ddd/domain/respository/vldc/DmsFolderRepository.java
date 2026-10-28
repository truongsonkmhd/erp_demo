package com.xxxx.ddd.domain.respository.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.DmsFolder;

import java.util.List;
import java.util.Optional;

public interface DmsFolderRepository {
    List<DmsFolder> findAll();
    List<DmsFolder> findByProjectId(String projectId);
    Optional<DmsFolder> findById(String id);
    DmsFolder save(DmsFolder folder);
    List<DmsFolder> saveAll(List<DmsFolder> folders);
    void delete(DmsFolder folder);
}
