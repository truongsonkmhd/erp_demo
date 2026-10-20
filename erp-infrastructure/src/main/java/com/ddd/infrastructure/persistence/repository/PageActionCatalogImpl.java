package com.xxxx.ddd.infrastructure.persistence.repository;

import com.xxxx.ddd.domain.model.entity.Action;
import com.xxxx.ddd.domain.model.entity.Page;
import com.xxxx.ddd.domain.respository.PageActionCatalog;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public class PageActionCatalogImpl implements PageActionCatalog {
    private final EntityManager entityManager;
    public PageActionCatalogImpl(EntityManager entityManager) { this.entityManager = entityManager; }
    public List<Page> pages() { return entityManager.createQuery("SELECT p FROM Page p ORDER BY p.id", Page.class).getResultList(); }
    public List<Action> actions() { return entityManager.createQuery("SELECT a FROM Action a ORDER BY a.id", Action.class).getResultList(); }
    public Optional<Page> page(Long id) { return Optional.ofNullable(entityManager.find(Page.class, id)); }
    public Optional<Action> action(Long id) { return Optional.ofNullable(entityManager.find(Action.class, id)); }
}
