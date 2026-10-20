package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.domain.respository.PageActionCatalog;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
public class PageActionController {
    private final PageActionCatalog catalog;
    public PageActionController(PageActionCatalog catalog) { this.catalog = catalog; }
    public record CatalogItem(Long id, String code, String name, String url) {}
    @GetMapping("/api/pages")
    public ResultMessage<List<CatalogItem>> pages() {
        return ResultUtil.data(catalog.pages().stream().map(p -> new CatalogItem(p.getId(), p.getCode(), p.getName(), p.getUrl())).toList());
    }
    @GetMapping("/api/actions")
    public ResultMessage<List<CatalogItem>> actions() {
        return ResultUtil.data(catalog.actions().stream().map(a -> new CatalogItem(a.getId(), a.getCode(), a.getName(), null)).toList());
    }
}
