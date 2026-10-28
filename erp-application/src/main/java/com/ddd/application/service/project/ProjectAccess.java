package com.xxxx.ddd.application.service.project;

import com.xxxx.ddd.application.exception.NotFoundException;
import com.xxxx.ddd.application.work.WorkRoles;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.model.entity.work.Project;
import com.xxxx.ddd.domain.model.enums.work.ApprovalStatus;
import com.xxxx.ddd.domain.respository.work.ProjectDepartmentRepository;
import com.xxxx.ddd.domain.respository.work.ProjectRepository;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Ai xem được dự án (dùng chung cho API dự án và API việc): Phòng Kỹ thuật và Liên đoàn trưởng thấy mọi dự án; đơn vị
 * chủ trì và đơn vị phối hợp chỉ thấy khi dự án đã được duyệt.
 */
@Component
public class ProjectAccess {
    private final ProjectRepository projects;
    private final ProjectDepartmentRepository projectDepartments;
    private final WorkRoles roles;

    public ProjectAccess(ProjectRepository projects, ProjectDepartmentRepository projectDepartments, WorkRoles roles) {
        this.projects = projects;
        this.projectDepartments = projectDepartments;
        this.roles = roles;
    }

    /** Phòng Kỹ thuật và Liên đoàn trưởng thấy mọi dự án. */
    public boolean seesAll(User user) {
        return roles.isTechnicalDept(user) || roles.isFederationHead(user);
    }

    public boolean canSee(Project p, User user) {
        if (p == null || p.deleted()) return false;
        if (seesAll(user)) return true;
        Long unit = user.getOrgUnit() == null ? null : user.getOrgUnit().getId();
        return p.getApprovalStatus() == ApprovalStatus.APPROVED && unit != null && participatingUnits(p).contains(unit);
    }

    /** The project when the user may see it; otherwise 404 (an unseen project is not revealed). */
    public Project visible(String code, User user) {
        Project p = projects.findByCode(code).orElseThrow(() -> new NotFoundException("Không tìm thấy dự án " + code));
        if (!canSee(p, user)) throw new NotFoundException("Không tìm thấy dự án " + code);
        return p;
    }

    /** Đơn vị chủ trì và các đơn vị phối hợp. */
    public Set<Long> participatingUnits(Project p) {
        Set<Long> ids = projectDepartments.findByProjectId(p.getId()).stream().map(d -> d.getDepartmentId()).collect(Collectors.toSet());
        ids.add(p.getLeadDepartmentId());
        return ids;
    }
}
