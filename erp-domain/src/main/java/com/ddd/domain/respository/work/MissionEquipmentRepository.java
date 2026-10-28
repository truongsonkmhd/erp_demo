package com.xxxx.ddd.domain.respository.work;

import com.xxxx.ddd.domain.model.entity.work.MissionEquipment;
import java.util.Collection;
import java.util.List;

/** Thiết bị của nhiệm vụ. */
public interface MissionEquipmentRepository {
    List<MissionEquipment> findByMissionId(Long missionId);
    /** Thay toàn bộ thiết bị của nhiệm vụ bằng danh sách mới (rỗng = không dùng thiết bị). */
    void replaceEquipment(Long missionId, Collection<Long> equipmentIds);
}
