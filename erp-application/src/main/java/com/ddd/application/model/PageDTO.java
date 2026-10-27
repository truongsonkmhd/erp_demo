package com.xxxx.ddd.application.model;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** One page of a list API; pageNo starts at 1 (like UserPageDTO). */
public record PageDTO<T>(List<T> items, int pageNo, int pageSize, long totalElements, int totalPages) {

    public static <E, T> PageDTO<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageDTO<>(page.getContent().stream().map(mapper).toList(), page.getNumber() + 1, page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
