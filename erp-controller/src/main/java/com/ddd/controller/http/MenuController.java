package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.model.MenuDTO;
import com.xxxx.ddd.application.service.menu.MenuAppService;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Slf4j
public class MenuController {
    private final MenuAppService menuAppService;
    public MenuController(MenuAppService menuAppService) { this.menuAppService = menuAppService; }

    @GetMapping("/api/menus/me")
    public ResultMessage<List<MenuDTO>> myMenus(Authentication authentication,
                                                @RequestParam(required = false) String module) {
        try {
            if (authentication == null) {
                return ResultUtil.error(401, "Unauthorized");
            }
            return ResultUtil.data(menuAppService.myMenus(authentication.getName(), module));
        } catch (IllegalArgumentException e) {
            return ResultUtil.error(401, e.getMessage());
        } catch (Exception e) {
            log.error("Load menus error", e);
            return ResultUtil.error(500, "Failed to load menus");
        }
    }
}
