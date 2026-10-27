package com.xxxx.ddd.domain.respository.work;

import com.xxxx.ddd.domain.model.entity.work.Equipment;
import java.util.Collection;
import java.util.List;

public interface EquipmentRepository {
    /** Thiết bị chưa xoá, mã hoặc tên chứa từ khoá (rỗng: tất cả), theo mã. */
    List<Equipment> search(String keyword);

    /** Thiết bị chưa xoá trong các id (kiểm tra lựa chọn trên form). */
    List<Equipment> findLiveByIds(Collection<Long> ids);

    /** By id, deleted ones included (an old mission still shows its devices). */
    List<Equipment> findByIds(Collection<Long> ids);
}
