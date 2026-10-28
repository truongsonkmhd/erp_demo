package com.xxxx.ddd.infrastructure.persistence.repository.work;

import com.xxxx.ddd.domain.model.entity.work.Equipment;
import com.xxxx.ddd.domain.respository.work.EquipmentRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.work.EquipmentJPAMapper;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Repository;

@Repository
public class EquipmentRepositoryImpl implements EquipmentRepository {
    private final EquipmentJPAMapper mapper;

    public EquipmentRepositoryImpl(EquipmentJPAMapper mapper) {
        this.mapper = mapper;
    }

    public List<Equipment> search(String keyword) {
        return mapper.search(keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT));
    }

    public List<Equipment> findLiveByIds(Collection<Long> ids) {
        return ids.isEmpty() ? List.of() : mapper.findByIdInAndIsDeletedFalse(ids);
    }

    public List<Equipment> findByIds(Collection<Long> ids) {
        return ids.isEmpty() ? List.of() : mapper.findAllById(ids);
    }
}
