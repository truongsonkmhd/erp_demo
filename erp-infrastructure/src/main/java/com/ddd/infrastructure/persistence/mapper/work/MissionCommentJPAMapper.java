package com.xxxx.ddd.infrastructure.persistence.mapper.work;

import com.xxxx.ddd.domain.model.entity.work.MissionComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MissionCommentJPAMapper extends JpaRepository<MissionComment, Long> {
    List<MissionComment> findByMissionIdAndIsDeletedFalseOrderByCreatedAtAsc(Long missionId);
}
