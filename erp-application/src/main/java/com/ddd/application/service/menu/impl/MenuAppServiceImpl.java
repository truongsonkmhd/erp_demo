package com.xxxx.ddd.application.service.menu.impl;

import com.xxxx.ddd.application.model.MenuDTO;
import com.xxxx.ddd.application.service.menu.MenuAppService;
import com.xxxx.ddd.domain.model.entity.Menu;
import com.xxxx.ddd.domain.model.entity.Permission;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.respository.MenuRepository;
import com.xxxx.ddd.domain.service.UserDomainService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MenuAppServiceImpl implements MenuAppService {

    private final MenuRepository menuRepository;
    private final UserDomainService userDomainService;

    public MenuAppServiceImpl(MenuRepository menuRepository, UserDomainService userDomainService) {
        this.menuRepository = menuRepository;
        this.userDomainService = userDomainService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuDTO> myMenus(String username, String module) {
        User user = userDomainService.getByUsernameOrEmail(username);
        // Admin's effective permissions are the whole catalog, so admin sees every menu.
        Set<String> granted = user.getEffectivePermissions().stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        Map<Long, MenuDTO> byId = new LinkedHashMap<>();
        Map<Long, Long> parentOf = new LinkedHashMap<>();
        for (Menu menu : menuRepository.findActive(module)) {
            if (menu.getPage() != null && !granted.contains(menu.getPage().getCode() + ":access")) {
                continue;
            }
            byId.put(menu.getId(), toDTO(menu));
            parentOf.put(menu.getId(), menu.getParentId());
        }

        List<MenuDTO> roots = new ArrayList<>();
        parentOf.forEach((id, parentId) -> {
            MenuDTO parent = parentId == null ? null : byId.get(parentId);
            if (parent != null) {
                parent.getChildren().add(byId.get(id));
            } else if (parentId == null) {
                roots.add(byId.get(id));
            }
        });
        return prune(roots);
    }

    /** Drops groups (no url) that ended up without visible children. */
    private List<MenuDTO> prune(List<MenuDTO> nodes) {
        List<MenuDTO> kept = new ArrayList<>();
        for (MenuDTO node : nodes) {
            node.setChildren(prune(node.getChildren()));
            if (node.getUrl() != null || !node.getChildren().isEmpty()) {
                kept.add(node);
            }
        }
        return kept;
    }

    private MenuDTO toDTO(Menu menu) {
        MenuDTO dto = new MenuDTO();
        dto.setId(menu.getId());
        dto.setCode(menu.getCode());
        dto.setTitle(menu.getTitle());
        dto.setIcon(menu.getIcon());
        dto.setModule(menu.getModule());
        dto.setSortOrder(menu.getSortOrder());
        if (menu.getPage() != null) {
            dto.setUrl(menu.getPage().getUrl());
            dto.setPageCode(menu.getPage().getCode());
        }
        return dto;
    }
}
