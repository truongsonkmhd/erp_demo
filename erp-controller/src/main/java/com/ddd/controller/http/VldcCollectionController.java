package com.xxxx.ddd.controller.http;

import com.fasterxml.jackson.databind.JsonNode;
import com.xxxx.ddd.application.vldc.VldcCollectionAppService;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** VLDC collections formerly in Firestore; rows have the shape of the frontend TS types. */
@RestController
@RequestMapping("/api/vldc/{collection}")
public class VldcCollectionController {
    private final VldcCollectionAppService service;

    public VldcCollectionController(VldcCollectionAppService service) { this.service = service; }

    @GetMapping
    public ResultMessage<List<?>> findAll(@PathVariable String collection) {
        return ResultUtil.data(service.findAll(collection));
    }

    @GetMapping("/empty")
    public ResultMessage<Boolean> isEmpty(@PathVariable String collection) {
        return ResultUtil.data(service.isEmpty(collection));
    }

    @PutMapping("/{id}")
    public ResultMessage<Object> upsert(@PathVariable String collection, @PathVariable String id,
                                        @RequestBody JsonNode body, Authentication authentication) {
        return ResultUtil.data(service.upsert(collection, id, body, authentication.getName()));
    }

    /** Seed/reset: anyone may fill an empty collection, only admin may overwrite existing rows. */
    @PutMapping
    public ResultMessage<Integer> replaceAll(@PathVariable String collection, @RequestBody JsonNode body,
                                             Authentication authentication) {
        boolean admin = authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return ResultUtil.data(service.replaceAll(collection, body, authentication.getName(), admin));
    }
}
