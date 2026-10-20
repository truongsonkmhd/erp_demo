package com.xxxx.ddd.infrastructure.persistence.repository;

import com.xxxx.ddd.domain.model.entity.Menu;
import com.xxxx.ddd.domain.respository.MenuRepository;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class MenuRepositoryImpl implements MenuRepository {
    private final EntityManager entityManager;
    public MenuRepositoryImpl(EntityManager entityManager) { this.entityManager = entityManager; }
    public List<Menu> findActive(String module) {
        String jpql = "SELECT m FROM Menu m LEFT JOIN FETCH m.page WHERE m.active = true"
                + (module == null ? "" : " AND m.module = :module")
                + " ORDER BY m.sortOrder, m.id";
        var query = entityManager.createQuery(jpql, Menu.class);
        if (module != null) query.setParameter("module", module);
        return query.getResultList();
    }
}
