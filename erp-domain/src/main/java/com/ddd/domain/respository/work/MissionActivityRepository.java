package com.xxxx.ddd.domain.respository.work;

import com.xxxx.ddd.domain.model.entity.work.MissionActivity;
import java.util.List;

/** Nhật ký thao tác của nhiệm vụ (chỉ ghi thêm). */
public interface MissionActivityRepository {
    /** Nhật ký, cũ trước. */
    List<MissionActivity> findByMissionId(Long missionId);
    MissionActivity save(MissionActivity activity);
}
