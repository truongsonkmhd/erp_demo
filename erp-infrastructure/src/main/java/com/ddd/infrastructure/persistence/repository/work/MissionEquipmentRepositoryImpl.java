package com.xxxx.ddd.infrastructure.persistence.repository.work;

import com.xxxx.ddd.domain.model.entity.work.MissionEquipment;
import com.xxxx.ddd.domain.respository.work.MissionEquipmentRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.work.MissionEquipmentJPAMapper;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class MissionEquipmentRepositoryImpl implements MissionEquipmentRepository {
    private final MissionEquipmentJPAMapper mapper;

    public MissionEquipmentRepositoryImpl(MissionEquipmentJPAMapper mapper) {
        this.mapper = mapper;
    }

    public List<MissionEquipment> findByMissionId(Long missionId) { return mapper.findByMissionIdOrderByIdAsc(missionId); }
    public void replaceEquipment(Long missionId, Collection<Long> equipmentIds) {
        mapper.deleteByMissionId(missionId);
        LocalDateTime now = LocalDateTime.now();
        mapper.saveAll(new LinkedHashSet<>(equipmentIds).stream()
                .map(id -> new MissionEquipment().setMissionId(missionId).setEquipmentId(id).setCreatedAt(now)).toList());
    }
}
