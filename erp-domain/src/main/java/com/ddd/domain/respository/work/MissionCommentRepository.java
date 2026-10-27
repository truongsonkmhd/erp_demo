package com.xxxx.ddd.domain.respository.work;

import com.xxxx.ddd.domain.model.entity.work.MissionComment;
import java.util.List;

/** Ghi chú của nhiệm vụ. */
public interface MissionCommentRepository {
    /** Ghi chú chưa xoá, cũ trước. */
    List<MissionComment> findByMissionId(Long missionId);
    MissionComment save(MissionComment comment);
}
