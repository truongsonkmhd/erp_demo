package com.xxxx.ddd.domain.respository;

import com.xxxx.ddd.domain.model.entity.Menu;
import java.util.List;

public interface MenuRepository {
    /** Active menus ordered by sort_order; module == null returns every module. */
    List<Menu> findActive(String module);
}
