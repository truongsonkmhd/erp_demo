package com.xxxx.ddd.application.service.mission;

import com.xxxx.ddd.application.model.work.EquipmentRefDTO;
import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.work.Equipment;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.work.EquipmentRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Danh mục thiết bị cho Nhiệm vụ: tìm để chọn trên form, kiểm tra lựa chọn, đổi id thành mã / tên. */
@Component
public class EquipmentCatalog {
    private final EquipmentRepository equipment;
    private final DepartmentRepository departments;

    public EquipmentCatalog(EquipmentRepository equipment, DepartmentRepository departments) {
        this.equipment = equipment;
        this.departments = departments;
    }

    @Transactional(readOnly = true)
    public List<EquipmentRefDTO> search(String keyword) {
        return refs(equipment.search(keyword));
    }

    /** The chosen devices, in the given order; 400 when one is unknown or deleted. */
    public List<EquipmentRefDTO> require(Collection<Long> ids) {
        Map<Long, Equipment> found = equipment.findLiveByIds(ids).stream().collect(Collectors.toMap(Equipment::getId, Function.identity()));
        for (Long id : ids) if (!found.containsKey(id)) throw new IllegalArgumentException("Không tìm thấy thiết bị " + id);
        return refs(ids.stream().map(found::get).toList());
    }

    /** Devices by id in the given order (deleted ones still shown on an old mission). */
    public List<EquipmentRefDTO> refsOf(Collection<Long> ids) {
        Map<Long, Equipment> found = ids.isEmpty() ? Map.of() : equipment.findByIds(ids).stream()
                .collect(Collectors.toMap(Equipment::getId, Function.identity()));
        return refs(ids.stream().map(found::get).filter(Objects::nonNull).toList());
    }

    private List<EquipmentRefDTO> refs(List<Equipment> list) {
        Map<Long, String> units = departments.findAll().stream().collect(Collectors.toMap(Department::getId, Department::getCode));
        return list.stream().map(e -> {
            EquipmentRefDTO dto = new EquipmentRefDTO();
            dto.setId(e.getId());
            dto.setCode(e.getCode());
            dto.setName(e.getName());
            dto.setDepartmentCode(e.getDepartmentId() == null ? null : units.get(e.getDepartmentId()));
            return dto;
        }).toList();
    }
}
