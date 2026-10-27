package com.xxxx.ddd.infrastructure.persistence.repository.work;

import com.xxxx.ddd.domain.model.entity.work.MissionActivity;
import com.xxxx.ddd.domain.respository.work.MissionActivityRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.work.MissionActivityJPAMapper;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class MissionActivityRepositoryImpl implements MissionActivityRepository {
    private final MissionActivityJPAMapper mapper;

    public MissionActivityRepositoryImpl(MissionActivityJPAMapper mapper) {
        this.mapper = mapper;
    }

    public List<MissionActivity> findByMissionId(Long missionId) { return mapper.findByMissionIdOrderByCreatedAtAscIdAsc(missionId); }
    public MissionActivity save(MissionActivity activity) { return mapper.save(activity); }
}
