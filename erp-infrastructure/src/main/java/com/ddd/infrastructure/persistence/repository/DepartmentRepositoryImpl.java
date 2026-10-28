package com.xxxx.ddd.infrastructure.persistence.repository;

import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.DepartmentJPAMapper;
import com.xxxx.ddd.infrastructure.persistence.mapper.RoleJPAMapper;
import com.xxxx.ddd.infrastructure.persistence.mapper.UserJPAMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class DepartmentRepositoryImpl implements DepartmentRepository {
    private final DepartmentJPAMapper mapper;
    private final RoleJPAMapper roles;
    private final UserJPAMapper users;

    public DepartmentRepositoryImpl(DepartmentJPAMapper mapper, RoleJPAMapper roles, UserJPAMapper users) {
        this.mapper = mapper;
        this.roles = roles;
        this.users = users;
    }

    public List<Department> findAll() { return mapper.findAll(); }
    public Optional<Department> findById(Long id) { return mapper.findById(id); }
    public Optional<Department> findByCode(String code) { return mapper.findByCode(code); }
    public boolean existsByCode(String code) { return mapper.existsByCode(code); }
    public boolean existsByCodeAndIdNot(String code, Long id) { return mapper.existsByCodeAndIdNot(code, id); }
    public long countRoles(Long id) { return roles.countByDepartmentId(id); }
    public long countChildren(Long id) { return mapper.countByParentId(id); }
    public long countUsers(Long id) { return users.countByOrgUnitId(id); }
    public Department save(Department department) { return mapper.save(department); }
    public void delete(Department department) { mapper.delete(department); }
}
