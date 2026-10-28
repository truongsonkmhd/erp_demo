package com.xxxx.ddd.infrastructure.persistence.repository.work;

import com.xxxx.ddd.domain.model.entity.work.MissionFollower;
import com.xxxx.ddd.domain.respository.work.MissionFollowerRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.work.MissionFollowerJPAMapper;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class MissionFollowerRepositoryImpl implements MissionFollowerRepository {
    private final MissionFollowerJPAMapper mapper;

    public MissionFollowerRepositoryImpl(MissionFollowerJPAMapper mapper) {
        this.mapper = mapper;
    }

    public List<MissionFollower> findByMissionId(Long missionId) { return mapper.findByMissionId(missionId); }
    public List<Long> findMissionIdsByUserId(Long userId) { return mapper.findMissionIdsByUserId(userId); }
    public void replaceFollowers(Long missionId, Collection<Long> userIds) {
        mapper.deleteByMissionId(missionId);
        LocalDateTime now = LocalDateTime.now();
        mapper.saveAll(new LinkedHashSet<>(userIds).stream()
                .map(id -> new MissionFollower().setMissionId(missionId).setUserId(id).setCreatedAt(now)).toList());
    }
}
