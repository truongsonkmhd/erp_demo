package com.xxxx.ddd.application.service.task.impl;

import com.xxxx.ddd.application.exception.ConflictException;
import com.xxxx.ddd.application.exception.NotFoundException;
import com.xxxx.ddd.application.model.PageDTO;
import com.xxxx.ddd.application.model.PageRequestParams;
import com.xxxx.ddd.application.model.command.CreateTaskCommand;
import com.xxxx.ddd.application.model.command.TaskProgressCommand;
import com.xxxx.ddd.application.model.work.DepartmentRefDTO;
import com.xxxx.ddd.application.model.work.PersonRefDTO;
import com.xxxx.ddd.application.model.work.TaskCommentDTO;
import com.xxxx.ddd.application.model.work.TaskDetailDTO;
import com.xxxx.ddd.application.model.work.TaskSummaryDTO;
import com.xxxx.ddd.application.service.project.ProjectAccess;
import com.xxxx.ddd.application.service.security.CurrentActor;
import com.xxxx.ddd.application.service.task.ProjectTaskAppService;
import com.xxxx.ddd.application.service.task.TaskRules;
import com.xxxx.ddd.application.service.task.TaskSpecs;
import com.xxxx.ddd.application.vldc.CollectionChangedEvent;
import com.xxxx.ddd.application.work.WorkCodes;
import com.xxxx.ddd.application.work.WorkNotificationEvent;
import com.xxxx.ddd.application.work.WorkRoles;
import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.model.entity.work.Project;
import com.xxxx.ddd.domain.model.entity.work.ProjectTask;
import com.xxxx.ddd.domain.model.entity.work.ProjectTaskActivity;
import com.xxxx.ddd.domain.model.entity.work.ProjectTaskComment;
import com.xxxx.ddd.domain.model.entity.work.ProjectTaskFollower;
import com.xxxx.ddd.domain.model.enums.work.ApprovalStatus;
import com.xxxx.ddd.domain.model.enums.work.Complexity;
import com.xxxx.ddd.domain.model.enums.work.Priority;
import com.xxxx.ddd.domain.model.enums.work.TaskAction;
import com.xxxx.ddd.domain.model.enums.work.TaskStatus;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.UserRepository;
import com.xxxx.ddd.domain.respository.work.ProjectRepository;
import com.xxxx.ddd.domain.respository.work.ProjectTaskActivityRepository;
import com.xxxx.ddd.domain.respository.work.ProjectTaskCommentRepository;
import com.xxxx.ddd.domain.respository.work.ProjectTaskFollowerRepository;
import com.xxxx.ddd.domain.respository.work.ProjectTaskRepository;
import com.xxxx.ddd.domain.service.AuthorizationService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProjectTaskAppServiceImpl implements ProjectTaskAppService {
    static final String COLLECTION = "project-tasks";
    private static final String PROJECTS = "projects";

    private final ProjectTaskRepository tasks;
    private final ProjectTaskFollowerRepository followers;
    private final ProjectTaskCommentRepository comments;
    private final ProjectTaskActivityRepository activities;
    private final ProjectRepository projects;
    private final UserRepository users;
    private final DepartmentRepository departments;
    private final ProjectAccess access;
    private final WorkRoles roles;
    private final AuthorizationService authorization;
    private final CurrentActor actor;
    private final ApplicationEventPublisher events;

    public ProjectTaskAppServiceImpl(ProjectTaskRepository tasks, ProjectTaskFollowerRepository followers, ProjectTaskCommentRepository comments,
                                     ProjectTaskActivityRepository activities, ProjectRepository projects, UserRepository users,
                                     DepartmentRepository departments, ProjectAccess access, WorkRoles roles,
                                     AuthorizationService authorization, CurrentActor actor, ApplicationEventPublisher events) {
        this.tasks = tasks;
        this.followers = followers;
        this.comments = comments;
        this.activities = activities;
        this.projects = projects;
        this.users = users;
        this.departments = departments;
        this.access = access;
        this.roles = roles;
        this.authorization = authorization;
        this.actor = actor;
        this.events = events;
    }

    // ---------------------------------------------------------------- reads

    @Override
    @Transactional(readOnly = true)
    public PageDTO<TaskSummaryDTO> list(String projectCode, TaskStatus status, String keyword, Integer pageNo, Integer pageSize) {
        User me = actor.require();
        Project p = access.visible(projectCode, me);
        Specification<ProjectTask> spec = Specification.where(TaskSpecs.liveOfProject(p.getId())).and(TaskSpecs.status(status)).and(TaskSpecs.keyword(keyword));
        Map<Long, Department> units = units();
        LocalDate today = LocalDate.now();
        return PageDTO.of(tasks.search(spec, PageRequestParams.of(pageNo, pageSize, Sort.by("dueDate", "code"))),
                t -> fillSummary(new TaskSummaryDTO(), t, p, units, today));
    }

    @Override
    @Transactional(readOnly = true)
    public TaskDetailDTO detail(String code) {
        User me = actor.require();
        return toDetail(visible(code, me), me);
    }

    // ---------------------------------------------------------------- create

    /**
     * Trưởng phòng của một đơn vị tham gia dự án đã duyệt giao việc cho nhân viên đơn vị mình (người mình quản lý, cấp
     * dưới, cùng đơn vị). Việc thuộc đơn vị của trưởng phòng.
     */
    @Override
    @Transactional
    public TaskDetailDTO create(CreateTaskCommand c) {
        User me = actor.require();
        Project p = access.visible(c.getProjectCode(), me);
        Long myUnit = me.getOrgUnit() == null ? null : me.getOrgUnit().getId();
        if (!roles.isUnitHead(me) || myUnit == null || !access.participatingUnits(p).contains(myUnit)) {
            throw new AccessDeniedException("Chỉ trưởng phòng của đơn vị tham gia dự án được giao việc");
        }
        if (p.getApprovalStatus() != ApprovalStatus.APPROVED) throw new ConflictException("Dự án chưa được Liên đoàn trưởng phê duyệt");
        String code = WorkCodes.requireNew(c.getCode(), "việc", tasks::existsByCode);
        String title = required(c.getTitle(), "Vui lòng nhập tên công việc");
        User assignee = activeUser(c.getAssigneeUserId(), "Không tìm thấy người thực hiện");
        if (assignee.getOrgUnit() == null || !myUnit.equals(assignee.getOrgUnit().getId()) || !authorization.canManage(me, assignee)) {
            throw new IllegalArgumentException("Chỉ giao việc cho nhân viên trong đơn vị của bạn");
        }
        LocalDate due = requireDue(c.getDueDate(), p.getEndDate());

        ProjectTask t = new ProjectTask().setCode(code).setProjectId(p.getId()).setTitle(title).setResultRequirement(blankToNull(c.getResultRequirement()))
                .setDepartmentId(myUnit).setAssigneeUserId(assignee.getId()).setStatus(TaskStatus.NEW).setProgress(0)
                .setComplexity(c.getComplexity() == null ? Complexity.MEDIUM : c.getComplexity()).setPriority(Priority.MEDIUM).setDueDate(due);
        t.setCreatedBy(me.getId());
        t.setUpdatedBy(me.getId());
        ProjectTask saved = tasks.save(t);

        Set<Long> follow = new LinkedHashSet<>(c.getFollowerUserIds() == null ? List.of() : c.getFollowerUserIds());
        follow.remove(assignee.getId());
        follow.remove(me.getId());
        for (Long id : follow) activeUser(id, "Không tìm thấy người phối hợp " + id);
        followers.replaceFollowers(saved.getId(), follow);

        log(saved, me, TaskAction.CREATE, null, TaskStatus.NEW, null, null);
        changed(saved, p);
        notify("TASK_ASSIGNED", union(List.of(assignee.getId()), follow), "Được giao việc " + saved.getCode(), saved.getTitle(), saved, p, me);
        return toDetail(saved, me);
    }

    // ---------------------------------------------------------------- assignee steps

    @Override
    @Transactional
    public TaskDetailDTO accept(String code, String note) {
        User me = actor.require();
        ProjectTask t = visible(code, me);
        requireAssignee(t, me);
        requireStatus(t, TaskStatus.NEW, "Việc không còn ở trạng thái Mới giao");
        return transition(t, me, TaskAction.ACCEPT, TaskStatus.IN_PROGRESS, note, List.of(t.getCreatedBy()), "đã được nhận");
    }

    @Override
    @Transactional
    public TaskDetailDTO updateProgress(String code, TaskProgressCommand c) {
        User me = actor.require();
        ProjectTask t = visible(code, me);
        requireAssignee(t, me);
        requireStatus(t, TaskStatus.IN_PROGRESS, "Chỉ cập nhật tiến độ khi việc đang thực hiện");
        if (c.getProgress() == null || c.getProgress() < 0 || c.getProgress() > 100) throw new IllegalArgumentException("Tiến độ phải từ 0 đến 100");
        t.setProgress(c.getProgress());
        if (c.getEvidence() != null && !c.getEvidence().isBlank()) t.setEvidence(c.getEvidence().trim());
        t.setUpdatedBy(me.getId());
        ProjectTask saved = tasks.save(t);
        String note = c.getNote() == null || c.getNote().isBlank() ? "Tiến độ " + c.getProgress() + "%" : c.getNote().trim();
        log(saved, me, TaskAction.UPDATE_PROGRESS, null, null, c.getProgress(), note);
        Project p = project(saved);
        changed(saved, p);
        notify("TASK_UPDATED", List.of(saved.getCreatedBy()), "Việc " + saved.getCode() + ": " + note, saved.getTitle(), saved, p, me);
        return toDetail(saved, me);
    }

    @Override
    @Transactional
    public TaskDetailDTO submit(String code, String note) {
        User me = actor.require();
        ProjectTask t = visible(code, me);
        requireAssignee(t, me);
        requireStatus(t, TaskStatus.IN_PROGRESS, "Chỉ nộp khi việc đang thực hiện");
        int before = t.getProgress() == null ? 0 : t.getProgress();
        t.setStatus(TaskStatus.IN_REVIEW).setProgress(100);
        t.setUpdatedBy(me.getId());
        ProjectTask saved = tasks.save(t);
        // The progress before submitting is kept so a return can restore it.
        log(saved, me, TaskAction.SUBMIT, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, before, blankToNull(note));
        Project p = project(saved);
        changed(saved, p);
        notify("TASK_UPDATED", List.of(saved.getCreatedBy()), "Việc " + saved.getCode() + " chờ nghiệm thu", saved.getTitle(), saved, p, me);
        return toDetail(saved, me);
    }

    // ---------------------------------------------------------------- assigner (trưởng phòng) steps

    @Override
    @Transactional
    public TaskDetailDTO approve(String code, String note) {
        User me = actor.require();
        ProjectTask t = visible(code, me);
        requireAssigner(t, me);
        requireStatus(t, TaskStatus.IN_REVIEW, "Việc không ở trạng thái chờ duyệt");
        t.setCompletedAt(LocalDateTime.now());
        t.setProgress(100);
        return transition(t, me, TaskAction.APPROVE, TaskStatus.DONE, note, union(List.of(t.getAssigneeUserId()), followerIds(t)), "đã được nghiệm thu");
    }

    @Override
    @Transactional
    public TaskDetailDTO returnTask(String code, String note) {
        User me = actor.require();
        ProjectTask t = visible(code, me);
        requireAssigner(t, me);
        String reason = required(note, "Vui lòng nhập lý do trả lại");
        requireStatus(t, TaskStatus.IN_REVIEW, "Việc không ở trạng thái chờ duyệt");
        int before = activities.findByTaskId(t.getId()).stream().filter(a -> a.getAction() == TaskAction.SUBMIT && a.getProgress() != null)
                .reduce((a, b) -> b).map(ProjectTaskActivity::getProgress).orElse(90);
        t.setProgress(Math.min(before, 90));
        return transition(t, me, TaskAction.RETURN, TaskStatus.IN_PROGRESS, reason, List.of(t.getAssigneeUserId()), "bị trả lại");
    }

    /** The assigner drags the task on the board to any status. */
    @Override
    @Transactional
    public TaskDetailDTO move(String code, TaskStatus toStatus) {
        User me = actor.require();
        ProjectTask t = visible(code, me);
        requireAssigner(t, me);
        if (toStatus == null) throw new IllegalArgumentException("Vui lòng chọn trạng thái");
        if (t.getStatus() == toStatus) return toDetail(t, me);
        TaskStatus from = t.getStatus();
        if (toStatus == TaskStatus.DONE) {
            t.setProgress(100).setCompletedAt(LocalDateTime.now());
        } else if (from == TaskStatus.DONE) {
            t.setProgress(Math.min(t.getProgress() == null ? 0 : t.getProgress(), 90)).setCompletedAt(null);
        }
        t.setStatus(toStatus);
        t.setUpdatedBy(me.getId());
        ProjectTask saved = tasks.save(t);
        log(saved, me, TaskAction.MOVE, from, toStatus, saved.getProgress(), from + " → " + toStatus);
        Project p = project(saved);
        changed(saved, p);
        notify("TASK_UPDATED", union(List.of(saved.getAssigneeUserId()), followerIds(saved)),
                "Việc " + saved.getCode() + " chuyển trạng thái", saved.getTitle(), saved, p, me);
        return toDetail(saved, me);
    }

    @Override
    @Transactional
    public TaskDetailDTO comment(String code, String content) {
        User me = actor.require();
        ProjectTask t = visible(code, me);
        String text = required(content, "Vui lòng nhập nội dung ghi chú");
        comments.save(new ProjectTaskComment().setTaskId(t.getId()).setUserId(me.getId())
                .setDepartmentId(me.getOrgUnit() == null ? null : me.getOrgUnit().getId()).setContent(text)
                .setCreatedAt(LocalDateTime.now()).setIsDeleted(false));
        Project p = project(t);
        changed(t, p);
        notify("TASK_UPDATED", union(List.of(t.getAssigneeUserId(), t.getCreatedBy()), followerIds(t)), "Ghi chú mới ở việc " + t.getCode(), text, t, p, me);
        return toDetail(t, me);
    }

    @Override
    @Transactional
    public void delete(String code) {
        User me = actor.require();
        ProjectTask t = visible(code, me);
        requireAssigner(t, me);
        t.softDelete(me.getId());
        t.setUpdatedBy(me.getId());
        tasks.save(t);
        log(t, me, TaskAction.DELETE, t.getStatus(), null, null, null);
        Project p = project(t);
        changed(t, p);
        notify("TASK_UPDATED", union(List.of(t.getAssigneeUserId()), followerIds(t)), "Việc " + t.getCode() + " đã bị xoá", t.getTitle(), t, p, me);
    }

    // ---------------------------------------------------------------- rules

    /** The task when the user may see it (sees the project, takes part in the task, or manages the assignee); else 404. */
    private ProjectTask visible(String code, User me) {
        ProjectTask t = tasks.findByCode(code).orElseThrow(() -> new NotFoundException("Không tìm thấy việc " + code));
        Project p = project(t);
        if (!p.deleted() && (access.canSee(p, me) || participant(t, me) || managesAssignee(t, me))) return t;
        throw new NotFoundException("Không tìm thấy việc " + code);
    }

    /** Assigner, assignee or follower. */
    private boolean participant(ProjectTask t, User me) {
        return Objects.equals(t.getCreatedBy(), me.getId()) || Objects.equals(t.getAssigneeUserId(), me.getId()) || followerIds(t).contains(me.getId());
    }

    private boolean managesAssignee(ProjectTask t, User me) {
        return users.findById(t.getAssigneeUserId()).map(a -> authorization.canManage(me, a)).orElse(false);
    }

    private Project project(ProjectTask t) {
        return projects.findById(t.getProjectId()).orElseThrow(() -> new NotFoundException("Không tìm thấy dự án của việc " + t.getCode()));
    }

    private static void requireAssignee(ProjectTask t, User me) {
        if (!Objects.equals(t.getAssigneeUserId(), me.getId())) throw new AccessDeniedException("Chỉ người thực hiện được làm thao tác này");
    }

    private static void requireAssigner(ProjectTask t, User me) {
        if (!Objects.equals(t.getCreatedBy(), me.getId())) throw new AccessDeniedException("Chỉ người giao việc được làm thao tác này");
    }

    private static void requireStatus(ProjectTask t, TaskStatus status, String message) {
        if (t.getStatus() != status) throw new ConflictException(message);
    }

    private User activeUser(Long id, String message) {
        if (id == null) throw new IllegalArgumentException(message);
        User u = users.findById(id).orElseThrow(() -> new IllegalArgumentException(message));
        if (Boolean.FALSE.equals(u.getActive()) || Boolean.TRUE.equals(u.getIsDeleted())) throw new IllegalArgumentException(message);
        return u;
    }

    /** Due date from today up to the project's end date. */
    private static LocalDate requireDue(LocalDate due, LocalDate latest) {
        if (due == null) throw new IllegalArgumentException("Vui lòng chọn hạn hoàn thành");
        if (due.isBefore(LocalDate.now())) throw new IllegalArgumentException("Hạn hoàn thành không được trước hôm nay");
        if (latest != null && due.isAfter(latest)) throw new IllegalArgumentException("Hạn hoàn thành không được quá hạn dự án");
        return due;
    }

    private static String required(String value, String message) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(message);
        return value.trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /** Status change by the assignee or the assigner: save, log, tell people. */
    private TaskDetailDTO transition(ProjectTask t, User me, TaskAction action, TaskStatus to, String note, Collection<Long> tell, String what) {
        TaskStatus from = t.getStatus();
        t.setStatus(to);
        t.setUpdatedBy(me.getId());
        ProjectTask saved = tasks.save(t);
        log(saved, me, action, from, to, saved.getProgress(), blankToNull(note));
        Project p = project(saved);
        changed(saved, p);
        notify("TASK_UPDATED", tell, "Việc " + saved.getCode() + " " + what, blankToNull(note) == null ? saved.getTitle() : note.trim(), saved, p, me);
        return toDetail(saved, me);
    }

    private void log(ProjectTask t, User me, TaskAction action, TaskStatus from, TaskStatus to, Integer progress, String note) {
        activities.save(new ProjectTaskActivity().setTaskId(t.getId()).setActorUserId(me.getId()).setAction(action)
                .setFromStatus(from == null ? null : from.name()).setToStatus(to == null ? null : to.name())
                .setProgress(progress).setNote(note).setCreatedAt(LocalDateTime.now()));
    }

    private List<Long> followerIds(ProjectTask t) {
        return followers.findByTaskId(t.getId()).stream().map(ProjectTaskFollower::getUserId).toList();
    }

    private static List<Long> union(Collection<Long> a, Collection<Long> b) {
        Set<Long> all = new LinkedHashSet<>(a);
        all.addAll(b);
        return new ArrayList<>(all);
    }

    // ---------------------------------------------------------------- mapping

    private TaskDetailDTO toDetail(ProjectTask t, User me) {
        Project p = project(t);
        Map<Long, Department> units = units();
        LocalDate today = LocalDate.now();
        TaskDetailDTO dto = fillSummary(new TaskDetailDTO(), t, p, units, today);
        dto.setResultRequirement(t.getResultRequirement());
        dto.setEvidence(t.getEvidence());
        dto.setCompletedAt(t.getCompletedAt());
        dto.setAssigner(personOf(t.getCreatedBy()));
        dto.setFollowers(followerIds(t).stream().map(this::personOf).filter(Objects::nonNull).toList());
        dto.setComments(comments.findByTaskId(t.getId()).stream().map(c -> {
            TaskCommentDTO cd = new TaskCommentDTO();
            cd.setId(c.getId());
            cd.setUser(personOf(c.getUserId()));
            Department d = c.getDepartmentId() == null ? null : units.get(c.getDepartmentId());
            cd.setDepartmentName(d == null ? null : d.getName());
            cd.setContent(c.getContent());
            cd.setCreatedAt(c.getCreatedAt());
            return cd;
        }).toList());
        TaskRules.Viewer v = new TaskRules.Viewer(Objects.equals(t.getAssigneeUserId(), me.getId()), Objects.equals(t.getCreatedBy(), me.getId()),
                participant(t, me), access.canSee(p, me));
        dto.setAllowedActions(TaskRules.allowedActions(t, v));
        dto.setAtRisk(TaskRules.atRisk(t, today));
        return dto;
    }

    private <T extends TaskSummaryDTO> T fillSummary(T dto, ProjectTask t, Project p, Map<Long, Department> units, LocalDate today) {
        dto.setCode(t.getCode());
        dto.setProjectCode(p.getCode());
        dto.setTitle(t.getTitle());
        dto.setStatus(t.getStatus());
        dto.setProgress(TaskRules.progress(t));
        dto.setComplexity(t.getComplexity());
        dto.setPriority(t.getPriority());
        dto.setDueDate(t.getDueDate());
        dto.setOverdue(TaskRules.overdue(t, today));
        dto.setAssignee(personOf(t.getAssigneeUserId()));
        dto.setDepartment(unit(units.get(t.getDepartmentId())));
        return dto;
    }

    private Map<Long, Department> units() {
        return departments.findAll().stream().collect(Collectors.toMap(Department::getId, Function.identity()));
    }

    private PersonRefDTO personOf(Long userId) {
        if (userId == null) return null;
        return users.findById(userId).map(u -> {
            PersonRefDTO dto = new PersonRefDTO();
            dto.setUserId(u.getId());
            dto.setFullName(u.getFullName());
            dto.setRoleCode(u.getRoleCode());
            dto.setDepartmentCode(u.getOrgUnit() == null ? null : u.getOrgUnit().getCode());
            return dto;
        }).orElse(null);
    }

    private static DepartmentRefDTO unit(Department d) {
        if (d == null) return null;
        DepartmentRefDTO dto = new DepartmentRefDTO();
        dto.setId(d.getId());
        dto.setCode(d.getCode());
        dto.setName(d.getName());
        return dto;
    }

    // ---------------------------------------------------------------- events

    /** Board viewers reload the tasks, project viewers the project figures (progress, open / overdue counts). */
    private void changed(ProjectTask t, Project p) {
        events.publishEvent(new CollectionChangedEvent(COLLECTION, List.of(t.getCode()), false));
        events.publishEvent(new CollectionChangedEvent(PROJECTS, List.of(p.getCode()), false));
    }

    private void notify(String type, Collection<Long> recipients, String title, String body, ProjectTask t, Project p, User me) {
        List<Long> to = recipients.stream().filter(Objects::nonNull).filter(id -> !id.equals(me.getId())).distinct().toList();
        if (to.isEmpty()) return;
        events.publishEvent(new WorkNotificationEvent(type, to, title, body, "projects/" + p.getCode() + "/viec/" + t.getCode(), t.getCode()));
    }
}
