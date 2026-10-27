package com.xxxx.ddd.infrastructure.persistence.mapper.work;

import com.xxxx.ddd.domain.model.entity.work.ProjectDepartment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectDepartmentJPAMapper extends JpaRepository<ProjectDepartment, Long> {
    List<ProjectDepartment> findByProjectId(Long projectId);
    @Query("select d.projectId from ProjectDepartment d where d.departmentId = :departmentId")
    List<Long> findProjectIdsByDepartmentId(@Param("departmentId") Long departmentId);
    @Modifying
    @Query("delete from ProjectDepartment d where d.projectId = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);
}
