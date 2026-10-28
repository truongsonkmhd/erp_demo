package com.xxxx.ddd.infrastructure.persistence.repository.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.DmsFolder;
import com.xxxx.ddd.domain.respository.vldc.DmsFolderRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.vldc.DmsFolderJPAMapper;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class DmsFolderRepositoryImpl implements DmsFolderRepository {
    private final DmsFolderJPAMapper jpa;

    public DmsFolderRepositoryImpl(DmsFolderJPAMapper jpa) {
        this.jpa = jpa;
    }

    public List<DmsFolder> findAll() { return jpa.findAll(Sort.by("projectId", "level", "name")); }
    public List<DmsFolder> findByProjectId(String projectId) { return jpa.findByProjectIdOrderByLevelAscNameAsc(projectId); }
    public Optional<DmsFolder> findById(String id) { return jpa.findById(id); }
    public DmsFolder save(DmsFolder folder) { return jpa.save(folder); }
    public List<DmsFolder> saveAll(List<DmsFolder> folders) { return jpa.saveAll(folders); }
    public void delete(DmsFolder folder) { jpa.delete(folder); }
}
