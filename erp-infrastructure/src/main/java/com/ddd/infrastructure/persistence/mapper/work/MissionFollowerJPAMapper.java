package com.xxxx.ddd.infrastructure.persistence.mapper.work;

import com.xxxx.ddd.domain.model.entity.work.MissionFollower;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MissionFollowerJPAMapper extends JpaRepository<MissionFollower, Long> {
    List<MissionFollower> findByMissionId(Long missionId);
    @Query("select f.missionId from MissionFollower f where f.userId = :userId")
    List<Long> findMissionIdsByUserId(@Param("userId") Long userId);
    @Modifying
    @Query("delete from MissionFollower f where f.missionId = :missionId")
    void deleteByMissionId(@Param("missionId") Long missionId);
}
