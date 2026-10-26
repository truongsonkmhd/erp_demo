package com.xxxx.ddd.infrastructure.persistence.mapper.vldc;

import com.xxxx.ddd.domain.model.entity.vldc.NewsPost;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsPostJPAMapper extends JpaRepository<NewsPost, String> {
}
