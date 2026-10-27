package com.xxxx.ddd.domain.respository.work;

import com.xxxx.ddd.domain.model.entity.work.MissionFollower;
import java.util.Collection;
import java.util.List;

/** Người phối hợp của nhiệm vụ. */
public interface MissionFollowerRepository {
    List<MissionFollower> findByMissionId(Long missionId);
    /** Các bản ghi mà người dùng đang phối hợp (lọc "Tôi phối hợp"). */
    List<Long> findMissionIdsByUserId(Long userId);
    /** Thay toàn bộ người phối hợp của nhiệm vụ bằng danh sách mới. */
    void replaceFollowers(Long missionId, Collection<Long> userIds);
}
