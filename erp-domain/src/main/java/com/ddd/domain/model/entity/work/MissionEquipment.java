package com.xxxx.ddd.domain.model.entity.work;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/**
 * Thiết bị dùng cho nhiệm vụ, chọn từ danh mục tài sản (không bắt buộc, có thể nhiều). equipmentId chưa có khoá ngoại:
 * MySQL chưa có bảng tài sản.
 */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_mission_equipment")
public class MissionEquipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mission_id", nullable = false)
    private Long missionId;

    @Column(name = "equipment_id", nullable = false)
    private Long equipmentId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
