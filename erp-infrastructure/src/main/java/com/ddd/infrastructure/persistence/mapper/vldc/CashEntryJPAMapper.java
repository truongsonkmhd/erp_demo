package com.xxxx.ddd.infrastructure.persistence.mapper.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.CashEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CashEntryJPAMapper extends JpaRepository<CashEntry, String> {
}
