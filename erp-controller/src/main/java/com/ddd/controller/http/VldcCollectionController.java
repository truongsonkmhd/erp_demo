package com.xxxx.ddd.controller.http;

import com.fasterxml.jackson.databind.JsonNode;
import com.xxxx.ddd.application.vldc.VldcCollectionAppService;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints shared by every VLDC collection formerly in Firestore; rows have the shape of the frontend TS types.
 * Each collection declares its own controller with an explicit path, e.g. NewsController at /api/vldc/news:
 * GET (all rows), GET /empty, PUT /{id} (upsert), PUT (replace all: seed/reset).
 */
public abstract class VldcCollectionController {
    private final String collection;
    private final VldcCollectionAppService service;

    /** collection = the dataset's "collection" in erp-frontend.com/src/features/vldc/data/datasets.ts. */
    protected VldcCollectionController(String collection, VldcCollectionAppService service) {
        this.collection = collection;
        this.service = service;
    }

    @GetMapping
    public ResultMessage<List<?>> findAll() {
        return ResultUtil.data(service.findAll(collection));
    }

    @GetMapping("/empty")
    public ResultMessage<Boolean> isEmpty() {
        return ResultUtil.data(service.isEmpty(collection));
    }

    @PutMapping("/{id}")
    public ResultMessage<Object> upsert(@PathVariable String id, @RequestBody JsonNode body, Authentication authentication) {
        return ResultUtil.data(service.upsert(collection, id, body, authentication.getName()));
    }

    /** Seed/reset: anyone may fill an empty collection, only admin may overwrite existing rows. */
    @PutMapping
    public ResultMessage<Integer> replaceAll(@RequestBody JsonNode body, Authentication authentication) {
        boolean admin = authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return ResultUtil.data(service.replaceAll(collection, body, authentication.getName(), admin));
    }
}
