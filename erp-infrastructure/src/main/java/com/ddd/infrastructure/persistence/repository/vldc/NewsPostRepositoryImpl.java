package com.xxxx.ddd.infrastructure.persistence.repository.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.NewsPost;
import com.xxxx.ddd.domain.respository.vldc.NewsPostRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.vldc.NewsPostJPAMapper;
import org.springframework.stereotype.Repository;

@Repository
public class NewsPostRepositoryImpl extends JpaRecordRepository<NewsPost> implements NewsPostRepository {
    public NewsPostRepositoryImpl(NewsPostJPAMapper mapper) {
        super(mapper);
    }
}
