package com.xxxx.ddd.domain.respository;

import com.xxxx.ddd.domain.model.entity.Action;
import com.xxxx.ddd.domain.model.entity.Page;
import java.util.List;
import java.util.Optional;

public interface PageActionCatalog {
    List<Page> pages();
    List<Action> actions();
    Optional<Page> page(Long id);
    Optional<Action> action(Long id);
}
