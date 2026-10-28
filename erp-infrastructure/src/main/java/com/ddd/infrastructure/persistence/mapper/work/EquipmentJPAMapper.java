package com.xxxx.ddd.infrastructure.persistence.mapper.work;

import com.xxxx.ddd.domain.model.entity.work.Equipment;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EquipmentJPAMapper extends JpaRepository<Equipment, Long> {
    @Query("SELECT e FROM Equipment e WHERE e.isDeleted = false AND (:q = '' OR LOWER(e.code) LIKE CONCAT('%', :q, '%') "
            + "OR LOWER(e.name) LIKE CONCAT('%', :q, '%')) ORDER BY e.code")
    List<Equipment> search(@Param("q") String keyword);

    List<Equipment> findByIdInAndIsDeletedFalse(Collection<Long> ids);
}
