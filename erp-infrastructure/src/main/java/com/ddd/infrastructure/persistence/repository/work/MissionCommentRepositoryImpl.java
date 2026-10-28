package com.xxxx.ddd.infrastructure.persistence.repository.work;

import com.xxxx.ddd.domain.model.entity.work.MissionComment;
import com.xxxx.ddd.domain.respository.work.MissionCommentRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.work.MissionCommentJPAMapper;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class MissionCommentRepositoryImpl implements MissionCommentRepository {
    private final MissionCommentJPAMapper mapper;

    public MissionCommentRepositoryImpl(MissionCommentJPAMapper mapper) {
        this.mapper = mapper;
    }

    public List<MissionComment> findByMissionId(Long missionId) { return mapper.findByMissionIdAndIsDeletedFalseOrderByCreatedAtAsc(missionId); }
    public MissionComment save(MissionComment comment) { return mapper.save(comment); }
}
