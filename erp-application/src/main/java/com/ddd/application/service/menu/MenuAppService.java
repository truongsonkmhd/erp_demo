package com.xxxx.ddd.application.service.menu;

import com.xxxx.ddd.application.model.MenuDTO;

import java.util.List;

public interface MenuAppService {
    /** Menu tree the user may see: leaves need "{pageCode}:access", empty groups are dropped. */
    List<MenuDTO> myMenus(String username, String module);
}
