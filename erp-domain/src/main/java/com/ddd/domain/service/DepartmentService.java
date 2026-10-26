package com.xxxx.ddd.domain.service;

import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Objects;

@Service
@Transactional
public class DepartmentService {
    private final DepartmentRepository repository;

    public DepartmentService(DepartmentRepository repository) { this.repository = repository; }

    @Transactional(readOnly = true)
    public List<Department> findAll() { return repository.findAll(); }

    @Transactional(readOnly = true)
    public Department get(Long id) {
        return repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Department not found"));
    }

    public Department create(String code, String name, String description, Long parentId) {
        validate(code, name, description);
        String normalized = code.trim().toLowerCase();
        if (repository.existsByCode(normalized)) throw new IllegalArgumentException("Department code already exists");
        validateParent(null, parentId);
        return repository.save(new Department().setCode(normalized).setName(name.trim()).setDescription(description).setParentId(parentId));
    }

    public Department update(Long id, String code, String name, String description, Long parentId) {
        validate(code, name, description);
        Department department = get(id);
        String normalized = code.trim().toLowerCase();
        if (repository.existsByCodeAndIdNot(normalized, id)) throw new IllegalArgumentException("Department code already exists");
        validateParent(id, parentId);
        return repository.save(department.setCode(normalized).setName(name.trim()).setDescription(description).setParentId(parentId));
    }

    public void delete(Long id) {
        Department department = get(id);
        if (repository.countRoles(id) > 0) throw new IllegalArgumentException("Department still contains roles");
        if (repository.countUsers(id) > 0) throw new IllegalArgumentException("Department still contains users");
        if (repository.countChildren(id) > 0) throw new IllegalArgumentException("Department still contains sub-units");
        repository.delete(department);
    }

    /** The parent must exist and must not be the unit itself or one of its descendants. */
    private void validateParent(Long id, Long parentId) {
        Long cursor = parentId;
        int depth = 0;
        while (cursor != null) {
            if (Objects.equals(cursor, id)) throw new IllegalArgumentException("A department cannot be placed under itself");
            if (++depth > 100) throw new IllegalArgumentException("Department tree is too deep");
            cursor = get(cursor).getParentId();
        }
    }

    private void validate(String code, String name, String description) {
        if (code == null || !code.matches("[a-zA-Z0-9_-]{1,50}")) throw new IllegalArgumentException("Department code must contain 1-50 letters, numbers, _ or -");
        if (name == null || name.isBlank() || name.length() > 150) throw new IllegalArgumentException("Department name is required (max 150 characters)");
        if (description != null && description.length() > 500) throw new IllegalArgumentException("Department description is too long (max 500 characters)");
    }
}
