package com.xxxx.ddd.application.service.mywork.impl;

import com.xxxx.ddd.application.model.PageDTO;
import com.xxxx.ddd.application.model.work.DepartmentRefDTO;
import com.xxxx.ddd.application.model.work.MyWorkDTO;
import com.xxxx.ddd.application.model.work.PersonRefDTO;
import com.xxxx.ddd.application.model.work.WorkEntryDTO;
import com.xxxx.ddd.application.model.work.WorkItemDTO;
import com.xxxx.ddd.application.model.work.WorkProjectDTO;
import com.xxxx.ddd.application.service.mission.MissionRules;
import com.xxxx.ddd.application.service.mywork.MyWorkAppService;
import com.xxxx.ddd.application.service.mywork.MyWorkEntries;
import com.xxxx.ddd.application.service.project.ProjectAccess;
import com.xxxx.ddd.application.service.project.ProjectProgress;
import com.xxxx.ddd.application.service.security.CurrentActor;
import com.xxxx.ddd.application.service.task.TaskRules;
import com.xxxx.ddd.application.work.WorkRoles;
import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.model.entity.work.Mission;
import com.xxxx.ddd.domain.model.entity.work.Project;
import com.xxxx.ddd.domain.model.entity.work.ProjectDeleteRequest;
import com.xxxx.ddd.domain.model.entity.work.ProjectTask;
import com.xxxx.ddd.domain.model.enums.work.ApprovalStatus;
import com.xxxx.ddd.domain.model.enums.work.MissionStatus;
import com.xxxx.ddd.domain.model.enums.work.ProjectStatus;
import com.xxxx.ddd.domain.model.enums.work.TaskStatus;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.UserRepository;
import com.xxxx.ddd.domain.respository.work.MissionFollowerRepository;
import com.xxxx.ddd.domain.respository.work.MissionRepository;
import com.xxxx.ddd.domain.respository.work.ProjectDeleteRequestRepository;
import com.xxxx.ddd.domain.respository.work.ProjectRepository;
import com.xxxx.ddd.domain.respository.work.ProjectTaskFollowerRepository;
import com.xxxx.ddd.domain.respository.work.ProjectTaskRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.xxxx.ddd.application.service.mywork.MyWorkEntries.*;

@Service
public class MyWorkAppServiceImpl implements MyWorkAppService {
    private static final int DELETE_DECISION_DAYS = 3;

    private final ProjectRepository projects;
    private final ProjectDeleteRequestRepository deleteRequests;
    private final ProjectTaskRepository tasks;
    private final ProjectTaskFollowerRepository taskFollowers;
    private final MissionRepository missions;
    private final MissionFollowerRepository missionFollowers;
    private final UserRepository users;
    private final DepartmentRepository departments;
    private final ProjectAccess projectAccess;
    private final WorkRoles roles;
    private final CurrentActor actor;

    public MyWorkAppServiceImpl(ProjectRepository projects, ProjectDeleteRequestRepository deleteRequests, ProjectTaskRepository tasks,
                                ProjectTaskFollowerRepository taskFollowers, MissionRepository missions, MissionFollowerRepository missionFollowers,
                                UserRepository users, DepartmentRepository departments, ProjectAccess projectAccess, WorkRoles roles, CurrentActor actor) {
        this.projects = projects;
        this.deleteRequests = deleteRequests;
        this.tasks = tasks;
        this.taskFollowers = taskFollowers;
        this.missions = missions;
        this.missionFollowers = missionFollowers;
        this.users = users;
        this.departments = departments;
        this.projectAccess = projectAccess;
        this.roles = roles;
        this.actor = actor;
    }

    // ---------------------------------------------------------------- Của tôi

    @Override
    @Transactional(readOnly = true)
    public MyWorkDTO mine(String filter, String keyword, Integer pageNo, Integer pageSize) {
        User me = actor.require();
        Lookup look = new Lookup();
        Map<Long, Project> live = projects.findLive().stream().collect(Collectors.toMap(Project::getId, Function.identity()));
        List<WorkItemDTO> rows = new ArrayList<>();

        if (roles.isFederationHead(me)) {
            for (Project p : live.values()) {
                if (p.getApprovalStatus() == ApprovalStatus.PENDING) {
                    rows.add(projectRow(p, PROJECT_APPROVAL, APPROVE_PROJECT, p.getName(), p.getStartDate(), p.getCreatedBy(), p.getLeadDepartmentId(), look));
                }
            }
            for (ProjectDeleteRequest r : deleteRequests.findAllPending()) {
                Project p = live.get(r.getProjectId());
                if (p == null) continue;
                LocalDate due = r.getRequestedAt().toLocalDate().plusDays(DELETE_DECISION_DAYS);
                rows.add(projectRow(p, PROJECT_DELETE, CONFIRM_DELETE, r.getReason(), due, r.getRequestedBy(), p.getLeadDepartmentId(), look));
            }
        }
        Long myUnit = me.getOrgUnit() == null ? null : me.getOrgUnit().getId();
        if (roles.isUnitHead(me) && myUnit != null) {
            for (Project p : live.values()) {
                boolean running = p.getApprovalStatus() == ApprovalStatus.APPROVED && p.getStatus() != ProjectStatus.COMPLETED;
                if (!running || !projectAccess.participatingUnits(p).contains(myUnit)) continue;
                if (tasks.findByProjectId(p.getId()).stream().noneMatch(t -> myUnit.equals(t.getDepartmentId()))) {
                    rows.add(projectRow(p, PROJECT_ASSIGN, ASSIGN_TASKS, p.getName(), p.getEndDate(), p.getCreatedBy(), myUnit, look));
                }
            }
        }

        Set<Long> followedTasks = new HashSet<>(taskFollowers.findTaskIdsByUserId(me.getId()));
        for (ProjectTask t : tasks.findOpen()) {
            Project p = live.get(t.getProjectId());
            if (p == null) continue;
            String reason = Objects.equals(t.getAssigneeUserId(), me.getId()) ? DO_TASK
                    : Objects.equals(t.getCreatedBy(), me.getId()) && t.getStatus() == TaskStatus.IN_REVIEW ? REVIEW_TASK
                    : followedTasks.contains(t.getId()) ? FOLLOW : null;
            if (reason != null) rows.add(taskRow(t, p, reason, look));
        }
        Set<Long> followedMissions = new HashSet<>(missionFollowers.findMissionIdsByUserId(me.getId()));
        for (Mission m : missions.findOpen()) {
            String reason = Objects.equals(m.getApproverUserId(), me.getId()) && m.getStatus() == MissionStatus.PENDING ? APPROVE_MISSION
                    : Objects.equals(m.getProposerUserId(), me.getId()) && m.getStatus() == MissionStatus.IN_PROGRESS ? DO_MISSION
                    : followedMissions.contains(m.getId()) ? FOLLOW : null;
            if (reason != null) rows.add(missionRow(m, reason, look));
        }

        LocalDate today = LocalDate.now();
        Set<String> used = rows.stream().filter(r -> !MISSION.equals(r.getKind())).map(WorkItemDTO::getProjectCode).collect(Collectors.toSet());
        Map<String, WorkProjectDTO> folders = folders(live.values().stream().filter(p -> used.contains(p.getCode())).toList(), look);
        List<WorkItemDTO> searched = rows.stream().filter(r -> matches(r, folders.get(r.getProjectCode()), keyword)).toList();
        List<WorkItemDTO> shown = searched.stream().filter(r -> mineFilter(r, filter == null ? "mine" : filter, today)).toList();
        return new MyWorkDTO(mineCounts(searched, today), MyWorkEntries.page(shown, folders, List.of(), pageNo, pageSize));
    }

    // ---------------------------------------------------------------- Toàn Liên đoàn

    @Override
    @Transactional(readOnly = true)
    public MyWorkDTO federation(String status, Long departmentId, String keyword, Integer pageNo, Integer pageSize) {
        User me = actor.require();
        if (!roles.isFederationHead(me)) throw new AccessDeniedException("Chỉ Liên đoàn trưởng xem được việc toàn Liên đoàn");
        Lookup look = new Lookup();
        Map<Long, Project> running = projects.findLive().stream()
                .filter(p -> p.getApprovalStatus() == ApprovalStatus.APPROVED
                        && (p.getStatus() == ProjectStatus.IN_PROGRESS || p.getStatus() == ProjectStatus.PAUSED))
                .collect(Collectors.toMap(Project::getId, Function.identity()));
        List<WorkItemDTO> rows = new ArrayList<>();
        for (ProjectTask t : tasks.findOpen()) {
            Project p = running.get(t.getProjectId());
            if (p != null) rows.add(taskRow(t, p, null, look));
        }
        for (Mission m : missions.findOpen()) rows.add(missionRow(m, null, look));

        Map<String, WorkProjectDTO> folders = folders(running.values(), look);
        List<WorkItemDTO> scoped = rows.stream()
                .filter(r -> departmentId == null || (r.getDepartment() != null && departmentId.equals(r.getDepartment().getId())))
                .filter(r -> matches(r, folders.get(r.getProjectCode()), keyword)).toList();
        List<WorkItemDTO> shown = scoped.stream().filter(r -> federationFilter(r, status)).toList();
        // With no status filter every running project shows, even with nothing open (its progress is still worth seeing).
        List<String> keep = status != null && !status.isBlank() ? List.of() : folders.values().stream()
                .filter(f -> departmentId == null || (f.getLeadDepartment() != null && departmentId.equals(f.getLeadDepartment().getId())))
                .filter(f -> keyword == null || keyword.isBlank() || (f.getCode() + " " + f.getName()).toLowerCase().contains(keyword.trim().toLowerCase()))
                .map(WorkProjectDTO::getCode).toList();
        PageDTO<WorkEntryDTO> page = MyWorkEntries.page(shown, folders, keep, pageNo, pageSize);
        return new MyWorkDTO(federationCounts(scoped), page);
    }

    // ---------------------------------------------------------------- rows

    private WorkItemDTO projectRow(Project p, String kind, String reason, String title, LocalDate due, Long fromUserId, Long unitId, Lookup look) {
        WorkItemDTO r = new WorkItemDTO();
        r.setKind(kind);
        r.setCode(p.getCode());
        r.setTitle(title);
        r.setProjectCode(p.getCode());
        r.setStatus(kind.equals(PROJECT_ASSIGN) ? p.getStatus().name() : p.getApprovalStatus().name());
        r.setDueDate(due);
        r.setOverdue(due != null && due.isBefore(LocalDate.now()));
        r.setMine(true);
        r.setReason(reason);
        r.setFrom(look.person(fromUserId));
        r.setDepartment(look.unit(unitId));
        r.setLink("projects/" + p.getCode());
        return r;
    }

    private WorkItemDTO taskRow(ProjectTask t, Project p, String reason, Lookup look) {
        LocalDate today = LocalDate.now();
        WorkItemDTO r = new WorkItemDTO();
        r.setKind(PROJECT_TASK);
        r.setCode(t.getCode());
        r.setTitle(t.getTitle());
        r.setProjectCode(p.getCode());
        r.setStatus(t.getStatus().name());
        r.setDueDate(t.getDueDate());
        r.setOverdue(TaskRules.overdue(t, today));
        r.setAtRisk(TaskRules.atRisk(t, today));
        r.setProgress(TaskRules.progress(t));
        r.setMine(reason != null && !FOLLOW.equals(reason));
        r.setReason(reason);
        r.setFrom(look.person(t.getCreatedBy()));
        r.setOwner(look.person(t.getAssigneeUserId()));
        r.setDepartment(look.unit(t.getDepartmentId()));
        r.setLink("projects/" + p.getCode() + "/viec/" + t.getCode());
        return r;
    }

    private WorkItemDTO missionRow(Mission m, String reason, Lookup look) {
        LocalDate today = LocalDate.now();
        WorkItemDTO r = new WorkItemDTO();
        r.setKind(MISSION);
        r.setCode(m.getCode());
        r.setTitle(m.getTitle());
        r.setProjectCode(m.getProjectId() == null ? null : look.project(m.getProjectId()).map(Project::getCode).orElse(null));
        r.setStatus(m.getStatus().name());
        r.setDueDate(m.getDueDate());
        r.setOverdue(MissionRules.overdue(m, today));
        r.setAtRisk(MissionRules.atRisk(m, today));
        r.setProgress(MissionRules.progress(m));
        r.setMine(reason != null && !FOLLOW.equals(reason));
        r.setReason(reason);
        r.setFrom(look.person(m.getProposerUserId()));
        r.setOwner(look.person(m.getStatus() == MissionStatus.PENDING ? m.getApproverUserId() : m.getProposerUserId()));
        r.setDepartment(look.unit(m.getDepartmentId()));
        r.setLink("projects/nhiem-vu/" + m.getCode());
        return r;
    }

    /** Thư mục dự án theo mã, kèm tiến độ theo độ phức tạp. */
    private Map<String, WorkProjectDTO> folders(Iterable<Project> list, Lookup look) {
        LocalDate today = LocalDate.now();
        Map<String, WorkProjectDTO> folders = new HashMap<>();
        for (Project p : list) {
            WorkProjectDTO f = new WorkProjectDTO();
            f.setCode(p.getCode());
            f.setName(p.getName());
            f.setStatus(p.getStatus());
            f.setApprovalStatus(p.getApprovalStatus());
            f.setProgress(ProjectProgress.of(p, tasks.findByProjectId(p.getId()), today).progress());
            f.setEndDate(p.getEndDate());
            f.setOverdue(p.getStatus() != ProjectStatus.COMPLETED && p.getEndDate().isBefore(today));
            f.setLeadDepartment(look.unit(p.getLeadDepartmentId()));
            folders.put(p.getCode(), f);
        }
        return folders;
    }

    /** People, units and projects looked up once per request. */
    private final class Lookup {
        private final Map<Long, Department> units = departments.findAll().stream().collect(Collectors.toMap(Department::getId, Function.identity()));
        private final Map<Long, Optional<User>> people = new HashMap<>();
        private final Map<Long, Optional<Project>> byId = new HashMap<>();

        PersonRefDTO person(Long id) {
            if (id == null) return null;
            return people.computeIfAbsent(id, users::findById).map(u -> {
                PersonRefDTO dto = new PersonRefDTO();
                dto.setUserId(u.getId());
                dto.setFullName(u.getFullName());
                dto.setRoleCode(u.getRoleCode());
                dto.setDepartmentCode(u.getOrgUnit() == null ? null : u.getOrgUnit().getCode());
                return dto;
            }).orElse(null);
        }

        DepartmentRefDTO unit(Long id) {
            Department d = id == null ? null : units.get(id);
            if (d == null) return null;
            DepartmentRefDTO dto = new DepartmentRefDTO();
            dto.setId(d.getId());
            dto.setCode(d.getCode());
            dto.setName(d.getName());
            return dto;
        }

        Optional<Project> project(Long id) {
            return byId.computeIfAbsent(id, projects::findById);
        }
    }
}
