package com.xxxx.ddd.infrastructure.persistence.repository.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.ScienceTopic;
import com.xxxx.ddd.domain.respository.vldc.ScienceTopicRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.vldc.ScienceTopicJPAMapper;
import org.springframework.stereotype.Repository;

@Repository
public class ScienceTopicRepositoryImpl extends JpaRecordRepository<ScienceTopic> implements ScienceTopicRepository {
    public ScienceTopicRepositoryImpl(ScienceTopicJPAMapper mapper) {
        super(mapper);
    }
}
