package com.xxxx.ddd.infrastructure.persistence.repository;

import com.xxxx.ddd.domain.model.entity.Permission;
import com.xxxx.ddd.domain.respository.PermissionRepository;
import com.xxxx.ddd.infrastructure.persistence.mapper.PermissionJPAMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class PermissionRepositoryImpl implements PermissionRepository {

    @Autowired
    private PermissionJPAMapper permissionJPAMapper;

    @Override
    public Permission save(Permission permission) {
        return permissionJPAMapper.save(permission);
    }

    @Override
    public Optional<Permission> findById(Long id) {
        return permissionJPAMapper.findById(id);
    }

    @Override
    public Optional<Permission> findByCode(String code) {
        return permissionJPAMapper.findByCode(code);
    }

    @Override
    public List<Permission> findAll() {
        return permissionJPAMapper.findAll();
    }

    @Override
    public List<Permission> findByCodes(Set<String> codes) {
        if (codes == null || codes.isEmpty()) {
            return List.of();
        }
        return permissionJPAMapper.findByCodeIn(codes);
    }

    @Override
    public boolean existsByCode(String code) {
        return permissionJPAMapper.existsByCode(code);
    }

    @Override
    public void deleteById(Long id) {
        permissionJPAMapper.deleteById(id);
    }

    @Override
    public void deleteRoleLinks(Long permissionId) {
        permissionJPAMapper.deleteRoleLinks(permissionId);
    }

}
