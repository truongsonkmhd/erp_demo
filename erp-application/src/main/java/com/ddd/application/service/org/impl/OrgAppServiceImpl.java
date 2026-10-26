package com.xxxx.ddd.application.service.org.impl;

import com.xxxx.ddd.application.mapper.AuthMapper;
import com.xxxx.ddd.application.model.OrgDirectoryDTO;
import com.xxxx.ddd.application.model.OrgPersonDTO;
import com.xxxx.ddd.application.model.PositionDTO;
import com.xxxx.ddd.application.service.org.OrgAppService;
import com.xxxx.ddd.application.service.security.CurrentActor;
import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.PositionRepository;
import com.xxxx.ddd.domain.respository.UserRepository;
import com.xxxx.ddd.domain.service.AuthorizationService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class OrgAppServiceImpl implements OrgAppService {
    private final AuthorizationService authorization;
    private final CurrentActor currentActor;
    private final DepartmentRepository departments;
    private final PositionRepository positions;
    private final UserRepository users;

    public OrgAppServiceImpl(AuthorizationService authorization, CurrentActor currentActor, DepartmentRepository departments,
                             PositionRepository positions, UserRepository users) {
        this.authorization = authorization;
        this.currentActor = currentActor;
        this.departments = departments;
        this.positions = positions;
        this.users = users;
    }

    @Override
    public OrgDirectoryDTO directory() {
        List<Department> units = departments.findAll();
        Map<Long, Department> byId = units.stream().collect(Collectors.toMap(Department::getId, Function.identity()));
        OrgDirectoryDTO dto = new OrgDirectoryDTO();
        dto.setPositions(positions());
        dto.setUnits(units.stream().sorted(Comparator.comparing(Department::getId)).map(u -> AuthMapper.toOrgUnitDTO(u, byId)).toList());
        dto.setPeople(users.findAllActive().stream().filter(u -> u.getRoles().stream().noneMatch(r -> r.isAdmin()))
                .map(AuthMapper::toOrgPersonDTO).toList());
        return dto;
    }

    @Override
    public List<PositionDTO> positions() {
        return positions.findAll().stream().map(AuthMapper::toPositionDTO).toList();
    }

    @Override
    public List<OrgPersonDTO> assignees() {
        return authorization.manageableUsers(currentActor.require()).stream().map(AuthMapper::toOrgPersonDTO).toList();
    }

    @Override
    public void requireCanAssign(Long targetUserId) {
        User target = users.findByIdWithAuth(targetUserId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!authorization.canManage(currentActor.require(), target)) {
            throw new AccessDeniedException("Người nhận không thuộc phạm vi quản lý");
        }
    }

    @Override
    public List<String> managedUnitCodes(User user) {
        Set<Long> ids = authorization.managedUnitIds(user);
        if (ids.isEmpty()) return List.of();
        return departments.findAll().stream().filter(d -> ids.contains(d.getId())).map(Department::getCode).toList();
    }
}
