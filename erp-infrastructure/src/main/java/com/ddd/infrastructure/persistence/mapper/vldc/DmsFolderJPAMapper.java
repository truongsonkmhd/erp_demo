package com.xxxx.ddd.infrastructure.persistence.mapper.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.DmsFolder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DmsFolderJPAMapper extends JpaRepository<DmsFolder, String> {
    List<DmsFolder> findByProjectIdOrderByLevelAscNameAsc(String projectId);
}
