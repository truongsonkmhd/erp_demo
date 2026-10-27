package com.xxxx.ddd.domain.respository.work;

import com.xxxx.ddd.domain.model.entity.work.Mission;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

/** Nhiệm vụ (bỏ qua bản ghi đã xoá mềm ở các hàm tìm). */
public interface MissionRepository {
    Optional<Mission> findByCode(String code);
    boolean existsByCode(String code);
    Mission save(Mission mission);
    Page<Mission> search(Specification<Mission> spec, Pageable pageable);
}
