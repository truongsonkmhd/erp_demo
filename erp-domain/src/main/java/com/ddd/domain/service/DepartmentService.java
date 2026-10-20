package com.xxxx.ddd.domain.service;

import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

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

    public Department create(String code, String name, String description) {
        validate(code, name, description);
        String normalized = code.trim().toLowerCase();
        if (repository.existsByCode(normalized)) throw new IllegalArgumentException("Department code already exists");
        return repository.save(new Department().setCode(normalized).setName(name.trim()).setDescription(description));
    }

    public Department update(Long id, String code, String name, String description) {
        validate(code, name, description);
        Department department = get(id);
        String normalized = code.trim().toLowerCase();
        if (repository.existsByCodeAndIdNot(normalized, id)) throw new IllegalArgumentException("Department code already exists");
        return repository.save(department.setCode(normalized).setName(name.trim()).setDescription(description));
    }

    public void delete(Long id) {
        Department department = get(id);
        if (repository.countRoles(id) > 0) throw new IllegalArgumentException("Department still contains roles");
        repository.delete(department);
    }

    private void validate(String code, String name, String description) {
        if (code == null || !code.matches("[a-zA-Z0-9_-]{1,50}")) throw new IllegalArgumentException("Department code must contain 1-50 letters, numbers, _ or -");
        if (name == null || name.isBlank() || name.length() > 150) throw new IllegalArgumentException("Department name is required (max 150 characters)");
        if (description != null && description.length() > 500) throw new IllegalArgumentException("Department description is too long (max 500 characters)");
    }
}
