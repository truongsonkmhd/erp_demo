package com.xxxx.ddd.infrastructure.persistence.mapper.work;

import com.xxxx.ddd.domain.model.entity.work.ProjectTaskFollower;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectTaskFollowerJPAMapper extends JpaRepository<ProjectTaskFollower, Long> {
    List<ProjectTaskFollower> findByTaskId(Long taskId);
    @Query("select f.taskId from ProjectTaskFollower f where f.userId = :userId")
    List<Long> findTaskIdsByUserId(@Param("userId") Long userId);
    @Modifying
    @Query("delete from ProjectTaskFollower f where f.taskId = :taskId")
    void deleteByTaskId(@Param("taskId") Long taskId);
}
