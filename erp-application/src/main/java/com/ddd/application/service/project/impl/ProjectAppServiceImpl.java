package com.xxxx.ddd.application.service.project.impl;

import com.xxxx.ddd.application.exception.ConflictException;
import com.xxxx.ddd.application.model.PageDTO;
import com.xxxx.ddd.application.model.PageRequestParams;
import com.xxxx.ddd.application.model.command.SaveProjectCommand;
import com.xxxx.ddd.application.model.work.DepartmentRefDTO;
import com.xxxx.ddd.application.model.work.PersonRefDTO;
import com.xxxx.ddd.application.model.work.ProjectDeleteRequestDTO;
import com.xxxx.ddd.application.model.work.ProjectDetailDTO;
import com.xxxx.ddd.application.model.work.ProjectPermissionsDTO;
import com.xxxx.ddd.application.model.work.ProjectSummaryDTO;
import com.xxxx.ddd.application.service.project.ProjectAccess;
import com.xxxx.ddd.application.service.project.ProjectAppService;
import com.xxxx.ddd.application.service.project.ProjectProgress;
import com.xxxx.ddd.application.service.project.ProjectSpecs;
import com.xxxx.ddd.application.service.security.CurrentActor;
import com.xxxx.ddd.application.vldc.CollectionChangedEvent;
import com.xxxx.ddd.application.work.WorkCodes;
import com.xxxx.ddd.application.work.WorkNotificationEvent;
import com.xxxx.ddd.application.work.WorkRoles;
import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.model.entity.work.Project;
import com.xxxx.ddd.domain.model.entity.work.ProjectDeleteRequest;
import com.xxxx.ddd.domain.model.enums.work.ApprovalStatus;
import com.xxxx.ddd.domain.model.enums.work.DeleteRequestStatus;
import com.xxxx.ddd.domain.model.enums.work.ProjectStatus;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.UserRepository;
import com.xxxx.ddd.domain.respository.work.ProjectDeleteRequestRepository;
import com.xxxx.ddd.domain.respository.work.ProjectDepartmentRepository;
import com.xxxx.ddd.domain.respository.work.ProjectRepository;
import com.xxxx.ddd.domain.respository.work.ProjectTaskRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProjectAppServiceImpl implements ProjectAppService {
    static final String COLLECTION = "projects";
    private static final Set<ProjectStatus> APPROVED_STATUSES = Set.of(ProjectStatus.IN_PROGRESS, ProjectStatus.PAUSED, ProjectStatus.COMPLETED);

    private final ProjectRepository projects;
    private final ProjectDepartmentRepository projectDepartments;
    private final ProjectDeleteRequestRepository deleteRequests;
    private final ProjectTaskRepository tasks;
    private final UserRepository users;
    private final DepartmentRepository departments;
    private final WorkRoles roles;
    private final CurrentActor actor;
    private final ApplicationEventPublisher events;
    private final ProjectAccess access;

    public ProjectAppServiceImpl(ProjectRepository projects, ProjectDepartmentRepository projectDepartments,
                                 ProjectDeleteRequestRepository deleteRequests, ProjectTaskRepository tasks, UserRepository users,
                                 DepartmentRepository departments, WorkRoles roles, CurrentActor actor, ApplicationEventPublisher events,
                                 ProjectAccess access) {
        this.projects = projects;
        this.projectDepartments = projectDepartments;
        this.deleteRequests = deleteRequests;
        this.tasks = tasks;
        this.users = users;
        this.departments = departments;
        this.roles = roles;
        this.actor = actor;
        this.events = events;
        this.access = access;
    }

    // ---------------------------------------------------------------- reads

    @Override
    @Transactional(readOnly = true)
    public PageDTO<ProjectSummaryDTO> list(ProjectStatus status, String keyword, Integer pageNo, Integer pageSize) {
        User me = actor.require();
        Specification<Project> spec = Specification.where(ProjectSpecs.notDeleted()).and(ProjectSpecs.status(status)).and(ProjectSpecs.keyword(keyword));
        if (!seesAll(me)) {
            Long unit = unitOf(me);
            spec = spec.and(ProjectSpecs.visibleToUnit(unit, unit == null ? List.of() : projectDepartments.findProjectIdsByDepartmentId(unit)));
        }
        Map<Long, Department> units = units();
        LocalDate today = LocalDate.now();
        return PageDTO.of(projects.search(spec, PageRequestParams.of(pageNo, pageSize, Sort.by(Sort.Direction.DESC, "createdAt", "id"))),
                p -> fillSummary(new ProjectSummaryDTO(), p, units, today));
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDetailDTO detail(String code) {
        User me = actor.require();
        return toDetail(visible(code, me), me);
    }

    // ---------------------------------------------------------------- create / edit

    @Override
    @Transactional
    public ProjectDetailDTO create(SaveProjectCommand command) {
        User me = actor.require();
        requireTechnical(me);
        Project p = new Project().setCode(WorkCodes.requireNew(command.getCode(), "dự án", projects::existsByCode));
        apply(p, command);
        p.setStatus(ProjectStatus.INITIATED).setApprovalStatus(ApprovalStatus.PENDING);
        p.setCreatedBy(me.getId());
        p.setUpdatedBy(me.getId());
        Project saved = projects.save(p);
        projectDepartments.replaceForProject(saved.getId(), coDepartments(command, saved.getLeadDepartmentId()));
        changed(saved);
        roles.federationHead().ifPresent(head -> notify("PROJECT_APPROVAL", List.of(head.getId()), "Dự án " + saved.getCode() + " chờ phê duyệt",
                me.getFullName() + " trình dự án \"" + saved.getName() + "\".", saved));
        if (saved.getManagerUserId() != null) {
            notify("PROJECT_APPROVAL", List.of(saved.getManagerUserId()), "Dự án " + saved.getCode(), "Bạn là chủ nhiệm dự án \"" + saved.getName() + "\".", saved);
        }
        return toDetail(saved, me);
    }

    @Override
    @Transactional
    public ProjectDetailDTO update(String code, SaveProjectCommand command) {
        User me = actor.require();
        Project p = visible(code, me);
        requireTechnical(me);
        Long previousManager = p.getManagerUserId();
        apply(p, command);
        if (p.getApprovalStatus() == ApprovalStatus.APPROVED) {
            if (command.getStatus() != null) {
                if (!APPROVED_STATUSES.contains(command.getStatus())) {
                    throw new IllegalArgumentException("Dự án đã duyệt chỉ chuyển giữa Đang thực hiện, Tạm dừng, Hoàn thành");
                }
                p.setStatus(command.getStatus());
            }
        } else {
            p.setStatus(ProjectStatus.INITIATED);
        }
        boolean resubmitted = p.getApprovalStatus() == ApprovalStatus.REJECTED;
        if (resubmitted) {
            p.setApprovalStatus(ApprovalStatus.PENDING).setApprovalNote(null).setApprovedBy(null).setApprovedAt(null);
        }
        p.setUpdatedBy(me.getId());
        Project saved = projects.save(p);
        projectDepartments.replaceForProject(saved.getId(), coDepartments(command, saved.getLeadDepartmentId()));
        changed(saved);
        if (resubmitted) {
            roles.federationHead().ifPresent(head -> notify("PROJECT_APPROVAL", List.of(head.getId()), "Dự án " + saved.getCode() + " chờ phê duyệt",
                    me.getFullName() + " sửa và trình lại dự án \"" + saved.getName() + "\".", saved));
        }
        if (saved.getManagerUserId() != null && !saved.getManagerUserId().equals(previousManager)) {
            notify("PROJECT_APPROVAL", List.of(saved.getManagerUserId()), "Dự án " + saved.getCode(), "Bạn là chủ nhiệm dự án \"" + saved.getName() + "\".", saved);
        }
        return toDetail(saved, me);
    }

    // ---------------------------------------------------------------- approval

    @Override
    @Transactional
    public ProjectDetailDTO approve(String code) {
        User me = actor.require();
        Project p = visible(code, me);
        requireFederationHead(me);
        requirePending(p);
        p.setApprovalStatus(ApprovalStatus.APPROVED).setStatus(ProjectStatus.IN_PROGRESS).setApprovalNote(null)
                .setApprovedBy(me.getId()).setApprovedAt(LocalDateTime.now());
        p.setUpdatedBy(me.getId());
        Project saved = projects.save(p);
        changed(saved);
        notify("PROJECT_APPROVAL", List.of(saved.getCreatedBy()), "Dự án " + saved.getCode() + " đã được phê duyệt", saved.getName(), saved);
        return toDetail(saved, me);
    }

    @Override
    @Transactional
    public ProjectDetailDTO reject(String code, String note) {
        User me = actor.require();
        Project p = visible(code, me);
        requireFederationHead(me);
        String reason = required(note, "Vui lòng ghi lý do không phê duyệt");
        requirePending(p);
        p.setApprovalStatus(ApprovalStatus.REJECTED).setApprovalNote(reason).setApprovedBy(me.getId()).setApprovedAt(LocalDateTime.now());
        p.setUpdatedBy(me.getId());
        Project saved = projects.save(p);
        changed(saved);
        notify("PROJECT_APPROVAL", List.of(saved.getCreatedBy()), "Dự án " + saved.getCode() + " không được phê duyệt", reason, saved);
        return toDetail(saved, me);
    }

    // ---------------------------------------------------------------- deletion

    @Override
    @Transactional
    public ProjectDetailDTO requestDelete(String code, String reason) {
        User me = actor.require();
        Project p = visible(code, me);
        if (!canRequestDelete(me)) throw new AccessDeniedException("Chỉ Phòng Kỹ thuật được đề nghị xoá dự án");
        String why = required(reason, "Vui lòng ghi lý do xoá dự án");
        if (deleteRequests.findPending(p.getId()).isPresent()) throw new ConflictException("Dự án đang có đề nghị xoá chờ Liên đoàn trưởng xác nhận");
        requireNoTasks(p);
        deleteRequests.save(new ProjectDeleteRequest().setProjectId(p.getId()).setReason(why).setRequestedBy(me.getId())
                .setRequestedAt(LocalDateTime.now()).setStatus(DeleteRequestStatus.PENDING));
        changed(p);
        roles.federationHead().ifPresent(head -> notify("PROJECT_DELETE", List.of(head.getId()), "Đề nghị xoá dự án " + p.getCode(),
                me.getFullName() + " đề nghị xoá \"" + p.getName() + "\": " + why, p));
        return toDetail(p, me);
    }

    @Override
    @Transactional
    public ProjectDetailDTO cancelDelete(String code) {
        User me = actor.require();
        Project p = visible(code, me);
        ProjectDeleteRequest request = pendingRequest(p);
        if (!Objects.equals(request.getRequestedBy(), me.getId())) throw new AccessDeniedException("Chỉ người đề nghị được huỷ đề nghị xoá");
        deleteRequests.save(request.setStatus(DeleteRequestStatus.CANCELLED));
        changed(p);
        return toDetail(p, me);
    }

    @Override
    @Transactional
    public void approveDelete(String code) {
        User me = actor.require();
        Project p = visible(code, me);
        requireFederationHead(me);
        ProjectDeleteRequest request = pendingRequest(p);
        requireNoTasks(p);
        deleteRequests.save(request.setStatus(DeleteRequestStatus.APPROVED).setDecidedBy(me.getId()).setDecidedAt(LocalDateTime.now()));
        p.softDelete(me.getId());
        p.setUpdatedBy(me.getId());
        projects.save(p);
        changed(p);
        notify("PROJECT_DELETE", List.of(request.getRequestedBy()), "Dự án " + p.getCode() + " đã được xoá", p.getName(), p);
    }

    @Override
    @Transactional
    public ProjectDetailDTO rejectDelete(String code, String note) {
        User me = actor.require();
        Project p = visible(code, me);
        requireFederationHead(me);
        String reason = required(note, "Vui lòng ghi lý do không xoá");
        ProjectDeleteRequest request = pendingRequest(p);
        deleteRequests.save(request.setStatus(DeleteRequestStatus.REJECTED).setDecidedBy(me.getId()).setDecidedAt(LocalDateTime.now()).setDecisionNote(reason));
        changed(p);
        notify("PROJECT_DELETE", List.of(request.getRequestedBy()), "Liên đoàn trưởng không đồng ý xoá dự án " + p.getCode(), reason, p);
        return toDetail(p, me);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PersonRefDTO> assignableUsers(String code, Long departmentId) {
        User me = actor.require();
        Project p = visible(code, me);
        if (departmentId == null || !participatingUnits(p).contains(departmentId)) {
            throw new IllegalArgumentException("Đơn vị không tham gia dự án");
        }
        return users.findAllActive().stream()
                .filter(u -> u.getOrgUnit() != null && departmentId.equals(u.getOrgUnit().getId()))
                .sorted(Comparator.comparing(User::getFullName, Comparator.nullsLast(String::compareTo)))
                .map(ProjectAppServiceImpl::person)
                .toList();
    }

    // ---------------------------------------------------------------- rules

    private boolean seesAll(User user) {
        return access.seesAll(user);
    }

    private Project visible(String code, User me) {
        return access.visible(code, me);
    }

    private Set<Long> participatingUnits(Project p) {
        return access.participatingUnits(p);
    }

    private void requireTechnical(User me) {
        if (!roles.isTechnicalDept(me)) throw new AccessDeniedException("Chỉ Phòng Kỹ thuật được lập và sửa dự án");
    }

    private void requireFederationHead(User me) {
        if (!roles.isFederationHead(me)) throw new AccessDeniedException("Chỉ Liên đoàn trưởng được thực hiện thao tác này");
    }

    private boolean canRequestDelete(User me) {
        return roles.isTechnicalDept(me) && !roles.isFederationHead(me);
    }

    private static void requirePending(Project p) {
        if (p.getApprovalStatus() != ApprovalStatus.PENDING) throw new ConflictException("Dự án không còn chờ phê duyệt");
    }

    private ProjectDeleteRequest pendingRequest(Project p) {
        return deleteRequests.findPending(p.getId()).orElseThrow(() -> new ConflictException("Dự án không có đề nghị xoá đang chờ"));
    }

    /** Tasks belong to whoever created them: they are deleted first, then the project. */
    private void requireNoTasks(Project p) {
        long live = tasks.countLiveByProjectId(p.getId());
        if (live > 0) throw new ConflictException("Dự án còn " + live + " việc. Người tạo từng việc cần xoá việc của mình trước.");
    }

    private static String required(String value, String message) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(message);
        return value.trim();
    }

    /** Fields of the form (not the code, status or approval). */
    private void apply(Project p, SaveProjectCommand c) {
        String name = required(c.getName(), "Vui lòng nhập tên dự án");
        if (c.getLeadDepartmentId() == null || departments.findById(c.getLeadDepartmentId()).isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn đơn vị chủ trì");
        }
        if (c.getManagerUserId() != null && users.findById(c.getManagerUserId()).isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy chủ nhiệm dự án");
        }
        if (c.getEstimatedBudget() == null || c.getEstimatedBudget().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Ngân sách dự kiến phải lớn hơn 0");
        }
        if (c.getStartDate() == null || c.getEndDate() == null) throw new IllegalArgumentException("Vui lòng nhập ngày bắt đầu và kết thúc");
        if (!c.getEndDate().isAfter(c.getStartDate())) throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
        p.setName(name)
                .setDescription(c.getDescription() == null || c.getDescription().isBlank() ? null : c.getDescription().trim())
                .setLeadDepartmentId(c.getLeadDepartmentId())
                .setManagerUserId(c.getManagerUserId())
                .setEstimatedBudget(c.getEstimatedBudget())
                .setStartDate(c.getStartDate())
                .setEndDate(c.getEndDate());
    }

    /** Supporting units that exist, without the lead unit. */
    /** Supporting units that exist, without the lead unit; Phòng Kỹ thuật always takes part in a project. */
    private List<Long> coDepartments(SaveProjectCommand c, Long leadId) {
        Map<Long, Department> known = units();
        List<Long> ids = new java.util.ArrayList<>(c.getCoDepartmentIds() == null ? List.of() : c.getCoDepartmentIds());
        for (Long id : ids) {
            if (!known.containsKey(id)) throw new IllegalArgumentException("Không tìm thấy đơn vị phối hợp " + id);
        }
        known.values().stream().filter(d -> WorkRoles.TECHNICAL_DEPARTMENT.equals(d.getCode())).findFirst().ifPresent(kt -> ids.add(kt.getId()));
        return ids.stream().filter(id -> !id.equals(leadId)).distinct().toList();
    }

    // ---------------------------------------------------------------- mapping

    private ProjectDetailDTO toDetail(Project p, User me) {
        Map<Long, Department> units = units();
        ProjectDetailDTO dto = fillSummary(new ProjectDetailDTO(), p, units, LocalDate.now());
        dto.setDescription(p.getDescription());
        dto.setManager(p.getManagerUserId() == null ? null : users.findById(p.getManagerUserId()).map(ProjectAppServiceImpl::person).orElse(null));
        dto.setCoDepartments(projectDepartments.findByProjectId(p.getId()).stream()
                .map(d -> unit(units.get(d.getDepartmentId()))).filter(Objects::nonNull).toList());
        dto.setEstimatedBudget(p.getEstimatedBudget());
        dto.setStartDate(p.getStartDate());
        dto.setApprovalNote(p.getApprovalNote());
        dto.setApprovedAt(p.getApprovedAt());
        dto.setCreatedBy(users.findById(p.getCreatedBy()).map(ProjectAppServiceImpl::person).orElse(null));
        ProjectDeleteRequest pending = deleteRequests.findPending(p.getId()).orElse(null);
        if (pending != null) {
            ProjectDeleteRequestDTO request = new ProjectDeleteRequestDTO();
            request.setReason(pending.getReason());
            request.setRequestedBy(users.findById(pending.getRequestedBy()).map(ProjectAppServiceImpl::person).orElse(null));
            request.setRequestedAt(pending.getRequestedAt());
            dto.setDeleteRequest(request);
        }
        dto.setLastDeleteRefusal(deleteRequests.findLatest(p.getId())
                .filter(r -> r.getStatus() == DeleteRequestStatus.REJECTED).map(ProjectDeleteRequest::getDecisionNote).orElse(null));

        boolean technical = roles.isTechnicalDept(me), head = roles.isFederationHead(me);
        ProjectPermissionsDTO can = new ProjectPermissionsDTO();
        can.setCanEdit(technical);
        can.setCanApprove(head && p.getApprovalStatus() == ApprovalStatus.PENDING);
        can.setCanRequestDelete(technical && !head && pending == null);
        can.setCanCancelDelete(pending != null && Objects.equals(pending.getRequestedBy(), me.getId()));
        can.setCanDecideDelete(head && pending != null);
        // The head of each unit taking part assigns work to the staff of that unit.
        Long myUnit = unitOf(me);
        can.setCanCreateTask(p.getApprovalStatus() == ApprovalStatus.APPROVED && roles.isUnitHead(me) && myUnit != null
                && participatingUnits(p).contains(myUnit));
        dto.setPermissions(can);
        return dto;
    }

    private <T extends ProjectSummaryDTO> T fillSummary(T dto, Project p, Map<Long, Department> units, LocalDate today) {
        ProjectProgress figures = ProjectProgress.of(p, tasks.findByProjectId(p.getId()), today);
        dto.setCode(p.getCode());
        dto.setName(p.getName());
        dto.setLeadDepartment(unit(units.get(p.getLeadDepartmentId())));
        dto.setStatus(p.getStatus());
        dto.setApprovalStatus(p.getApprovalStatus());
        dto.setProgress(figures.progress());
        dto.setEndDate(p.getEndDate());
        dto.setDelayDays(figures.delayDays());
        dto.setOpenTaskCount(figures.openTaskCount());
        dto.setOverdueTaskCount(figures.overdueTaskCount());
        dto.setHasPendingDeleteRequest(deleteRequests.findPending(p.getId()).isPresent());
        return dto;
    }

    private Map<Long, Department> units() {
        return departments.findAll().stream().collect(Collectors.toMap(Department::getId, Function.identity()));
    }

    private static Long unitOf(User user) {
        return user.getOrgUnit() == null ? null : user.getOrgUnit().getId();
    }

    private static DepartmentRefDTO unit(Department d) {
        if (d == null) return null;
        DepartmentRefDTO dto = new DepartmentRefDTO();
        dto.setId(d.getId());
        dto.setCode(d.getCode());
        dto.setName(d.getName());
        return dto;
    }

    static PersonRefDTO person(User u) {
        PersonRefDTO dto = new PersonRefDTO();
        dto.setUserId(u.getId());
        dto.setFullName(u.getFullName());
        dto.setRoleCode(u.getRoleCode());
        dto.setDepartmentCode(u.getOrgUnit() == null ? null : u.getOrgUnit().getCode());
        return dto;
    }

    // ---------------------------------------------------------------- events

    /** Viewers reload the projects (WebSocket /topic/vldc/projects after commit). */
    private void changed(Project p) {
        events.publishEvent(new CollectionChangedEvent(COLLECTION, List.of(p.getCode()), false));
    }

    private void notify(String type, List<Long> recipients, String title, String body, Project p) {
        List<Long> to = recipients.stream().filter(Objects::nonNull).distinct().toList();
        if (to.isEmpty()) return;
        events.publishEvent(new WorkNotificationEvent(type, to, title, body, "/vldc/projects/" + p.getCode(), p.getCode()));
    }
}
