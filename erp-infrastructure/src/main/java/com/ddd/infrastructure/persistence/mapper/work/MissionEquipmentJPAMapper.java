package com.xxxx.ddd.infrastructure.persistence.mapper.work;

import com.xxxx.ddd.domain.model.entity.work.MissionEquipment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MissionEquipmentJPAMapper extends JpaRepository<MissionEquipment, Long> {
    List<MissionEquipment> findByMissionIdOrderByIdAsc(Long missionId);
    @Modifying
    @Query("delete from MissionEquipment e where e.missionId = :missionId")
    void deleteByMissionId(@Param("missionId") Long missionId);
}
