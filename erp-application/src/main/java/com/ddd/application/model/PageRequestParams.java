package com.xxxx.ddd.application.model;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/** pageNo / pageSize of a list API to a Pageable: pageNo from 1, 10 rows by default, at most 500 (a project's board). */
public final class PageRequestParams {
    public static final int DEFAULT_SIZE = 10;
    public static final int MAX_SIZE = 500;

    private PageRequestParams() {
    }

    public static Pageable of(Integer pageNo, Integer pageSize, Sort sort) {
        int page = pageNo == null || pageNo < 1 ? 1 : pageNo;
        int size = pageSize == null || pageSize < 1 ? DEFAULT_SIZE : Math.min(pageSize, MAX_SIZE);
        return PageRequest.of(page - 1, size, sort);
    }
}
