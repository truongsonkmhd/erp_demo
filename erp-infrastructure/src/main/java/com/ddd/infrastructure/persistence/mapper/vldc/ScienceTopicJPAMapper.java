package com.xxxx.ddd.infrastructure.persistence.mapper.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.ScienceTopic;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScienceTopicJPAMapper extends JpaRepository<ScienceTopic, String> {
}
