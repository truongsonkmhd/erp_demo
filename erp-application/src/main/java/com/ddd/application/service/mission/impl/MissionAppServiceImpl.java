package com.xxxx.ddd.application.service.mission.impl;

import com.xxxx.ddd.application.exception.ConflictException;
import com.xxxx.ddd.application.exception.NotFoundException;
import com.xxxx.ddd.application.model.PageDTO;
import com.xxxx.ddd.application.model.PageRequestParams;
import com.xxxx.ddd.application.model.command.SaveMissionCommand;
import com.xxxx.ddd.application.model.command.TaskProgressCommand;
import com.xxxx.ddd.application.model.work.DepartmentRefDTO;
import com.xxxx.ddd.application.model.work.MissionDetailDTO;
import com.xxxx.ddd.application.model.work.MissionSummaryDTO;
import com.xxxx.ddd.application.model.work.PersonRefDTO;
import com.xxxx.ddd.application.model.work.ProjectRefDTO;
import com.xxxx.ddd.application.model.work.TaskCommentDTO;
import com.xxxx.ddd.application.service.mission.EquipmentCatalog;
import com.xxxx.ddd.application.service.mission.MissionAppService;
import com.xxxx.ddd.application.service.mission.MissionRules;
import com.xxxx.ddd.application.service.mission.MissionSpecs;
import com.xxxx.ddd.application.service.project.ProjectAccess;
import com.xxxx.ddd.application.service.security.CurrentActor;
import com.xxxx.ddd.application.vldc.CollectionChangedEvent;
import com.xxxx.ddd.application.work.WorkCodes;
import com.xxxx.ddd.application.work.WorkNotificationEvent;
import com.xxxx.ddd.application.work.WorkRoles;
import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.model.entity.work.Mission;
import com.xxxx.ddd.domain.model.entity.work.MissionActivity;
import com.xxxx.ddd.domain.model.entity.work.MissionComment;
import com.xxxx.ddd.domain.model.entity.work.MissionEquipment;
import com.xxxx.ddd.domain.model.entity.work.MissionFollower;
import com.xxxx.ddd.domain.model.entity.work.Project;
import com.xxxx.ddd.domain.model.enums.work.MissionAction;
import com.xxxx.ddd.domain.model.enums.work.MissionStatus;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.UserRepository;
import com.xxxx.ddd.domain.respository.work.MissionActivityRepository;
import com.xxxx.ddd.domain.respository.work.MissionCommentRepository;
import com.xxxx.ddd.domain.respository.work.MissionEquipmentRepository;
import com.xxxx.ddd.domain.respository.work.MissionFollowerRepository;
import com.xxxx.ddd.domain.respository.work.MissionRepository;
import com.xxxx.ddd.domain.respository.work.ProjectRepository;
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
public class MissionAppServiceImpl implements MissionAppService {
    static final String COLLECTION = "missions";
    private static final String NOTIFY_TYPE = "MISSION_APPROVAL";

    private final MissionRepository missions;
    private final MissionFollowerRepository followers;
    private final MissionCommentRepository comments;
    private final MissionActivityRepository activities;
    private final MissionEquipmentRepository equipment;
    private final ProjectRepository projects;
    private final UserRepository users;
    private final DepartmentRepository departments;
    private final ProjectAccess projectAccess;
    private final WorkRoles roles;
    private final AuthorizationService authorization;
    private final EquipmentCatalog catalog;
    private final CurrentActor actor;
    private final ApplicationEventPublisher events;

    public MissionAppServiceImpl(MissionRepository missions, MissionFollowerRepository followers, MissionCommentRepository comments,
                                 MissionActivityRepository activities, MissionEquipmentRepository equipment, ProjectRepository projects,
                                 UserRepository users, DepartmentRepository departments, ProjectAccess projectAccess, WorkRoles roles,
                                 AuthorizationService authorization, EquipmentCatalog catalog, CurrentActor actor,
                                 ApplicationEventPublisher events) {
        this.missions = missions;
        this.followers = followers;
        this.comments = comments;
        this.activities = activities;
        this.equipment = equipment;
        this.projects = projects;
        this.users = users;
        this.departments = departments;
        this.projectAccess = projectAccess;
        this.roles = roles;
        this.authorization = authorization;
        this.catalog = catalog;
        this.actor = actor;
        this.events = events;
    }

    // ---------------------------------------------------------------- reads

    @Override
    @Transactional(readOnly = true)
    public PageDTO<MissionSummaryDTO> list(MissionStatus status, String keyword, Integer pageNo, Integer pageSize) {
        User me = actor.require();
        Specification<Mission> spec = Specification.where(MissionSpecs.notDeleted()).and(MissionSpecs.status(status)).and(MissionSpecs.keyword(keyword))
                .and(MissionSpecs.visibleTo(me.getId(), followers.findMissionIdsByUserId(me.getId()), authorization.managedUnitIds(me)));
        Map<Long, Department> units = units();
        LocalDate today = LocalDate.now();
        return PageDTO.of(missions.search(spec, PageRequestParams.of(pageNo, pageSize, Sort.by("dueDate", "code"))),
                m -> fillSummary(new MissionSummaryDTO(), m, units, today));
    }

    @Override
    @Transactional(readOnly = true)
    public MissionDetailDTO detail(String code) {
        User me = actor.require();
        return toDetail(visible(code, me), me);
    }

    @Override
    @Transactional(readOnly = true)
    public PersonRefDTO approver() {
        return roles.directSuperior(actor.require()).map(MissionAppServiceImpl::person).orElse(null);
    }

    // ---------------------------------------------------------------- proposer

    @Override
    @Transactional
    public MissionDetailDTO create(SaveMissionCommand c) {
        User me = actor.require();
        User approver = roles.directSuperior(me).orElseThrow(() -> new AccessDeniedException("Bạn không có cấp trên để duyệt nhiệm vụ"));
        Mission m = new Mission().setCode(WorkCodes.requireNew(c.getCode(), "nhiệm vụ", missions::existsByCode))
                .setProposerUserId(me.getId()).setApproverUserId(approver.getId()).setStatus(MissionStatus.PENDING).setProgress(0);
        apply(m, c, me);
        m.setCreatedBy(me.getId());
        m.setUpdatedBy(me.getId());
        Mission saved = missions.save(m);
        saveLists(saved, c, me);
        log(saved, me, MissionAction.CREATE, null, MissionStatus.PENDING, null);
        changed(saved);
        notify(List.of(approver.getId()), "Nhiệm vụ " + saved.getCode() + " chờ duyệt", me.getFullName() + " lập nhiệm vụ \"" + saved.getTitle() + "\".", saved, me);
        notify(followerIds(saved), "Bạn được thêm phối hợp nhiệm vụ " + saved.getCode(), saved.getTitle(), saved, me);
        return toDetail(saved, me);
    }

    @Override
    @Transactional
    public MissionDetailDTO update(String code, SaveMissionCommand c) {
        User me = actor.require();
        Mission m = visible(code, me);
        requireProposer(m, me);
        requireStatus(m, MissionStatus.PENDING, "Chỉ sửa nhiệm vụ khi còn chờ duyệt");
        apply(m, c, me);
        m.setUpdatedBy(me.getId());
        Mission saved = missions.save(m);
        saveLists(saved, c, me);
        log(saved, me, MissionAction.UPDATE, null, null, null);
        changed(saved);
        notify(List.of(saved.getApproverUserId()), "Nhiệm vụ " + saved.getCode() + " đã được sửa", saved.getTitle(), saved, me);
        return toDetail(saved, me);
    }

    @Override
    @Transactional
    public MissionDetailDTO updateProgress(String code, TaskProgressCommand c) {
        User me = actor.require();
        Mission m = visible(code, me);
        requireProposer(m, me);
        requireStatus(m, MissionStatus.IN_PROGRESS, "Chỉ cập nhật tiến độ khi nhiệm vụ đang thực hiện");
        if (c.getProgress() == null || c.getProgress() < 0 || c.getProgress() > 100) throw new IllegalArgumentException("Tiến độ phải từ 0 đến 100");
        m.setProgress(c.getProgress());
        if (c.getEvidence() != null && !c.getEvidence().isBlank()) m.setEvidence(c.getEvidence().trim());
        m.setUpdatedBy(me.getId());
        Mission saved = missions.save(m);
        String note = blankToNull(c.getNote()) == null ? "Tiến độ " + c.getProgress() + "%" : c.getNote().trim();
        log(saved, me, MissionAction.UPDATE_PROGRESS, null, null, note);
        changed(saved);
        notify(List.of(saved.getApproverUserId()), "Nhiệm vụ " + saved.getCode() + ": " + note, saved.getTitle(), saved, me);
        return toDetail(saved, me);
    }

    /** No acceptance step: reporting it done closes the mission. */
    @Override
    @Transactional
    public MissionDetailDTO complete(String code, String note) {
        User me = actor.require();
        Mission m = visible(code, me);
        requireProposer(m, me);
        requireStatus(m, MissionStatus.IN_PROGRESS, "Chỉ báo hoàn thành khi nhiệm vụ đang thực hiện");
        m.setProgress(100).setCompletedAt(LocalDateTime.now());
        return transition(m, me, MissionAction.COMPLETE, MissionStatus.DONE, note, union(List.of(m.getApproverUserId()), followerIds(m)), "đã hoàn thành");
    }

    @Override
    @Transactional
    public void delete(String code) {
        User me = actor.require();
        Mission m = visible(code, me);
        requireProposer(m, me);
        m.softDelete(me.getId());
        m.setUpdatedBy(me.getId());
        missions.save(m);
        log(m, me, MissionAction.DELETE, m.getStatus(), null, null);
        changed(m);
        notify(List.of(m.getApproverUserId()), "Nhiệm vụ " + m.getCode() + " đã bị xoá", m.getTitle(), m, me);
    }

    // ---------------------------------------------------------------- approver

    @Override
    @Transactional
    public MissionDetailDTO approve(String code, String note) {
        User me = actor.require();
        Mission m = visible(code, me);
        requireApprover(m, me);
        requireStatus(m, MissionStatus.PENDING, "Nhiệm vụ không còn chờ duyệt");
        m.setDecidedAt(LocalDateTime.now()).setDecisionNote(null);
        return transition(m, me, MissionAction.APPROVE, MissionStatus.IN_PROGRESS, note, union(List.of(m.getProposerUserId()), followerIds(m)), "đã được duyệt");
    }

    @Override
    @Transactional
    public MissionDetailDTO reject(String code, String note) {
        User me = actor.require();
        Mission m = visible(code, me);
        requireApprover(m, me);
        String reason = required(note, "Vui lòng nhập lý do từ chối");
        requireStatus(m, MissionStatus.PENDING, "Nhiệm vụ không còn chờ duyệt");
        m.setDecidedAt(LocalDateTime.now()).setDecisionNote(reason);
        return transition(m, me, MissionAction.REJECT, MissionStatus.REJECTED, reason, union(List.of(m.getProposerUserId()), followerIds(m)), "bị từ chối");
    }

    @Override
    @Transactional
    public MissionDetailDTO comment(String code, String content) {
        User me = actor.require();
        Mission m = visible(code, me);
        String text = required(content, "Vui lòng nhập nội dung ghi chú");
        comments.save(new MissionComment().setMissionId(m.getId()).setUserId(me.getId())
                .setDepartmentId(me.getOrgUnit() == null ? null : me.getOrgUnit().getId()).setContent(text)
                .setCreatedAt(LocalDateTime.now()).setIsDeleted(false));
        changed(m);
        notify(union(List.of(m.getProposerUserId(), m.getApproverUserId()), followerIds(m)), "Ghi chú mới ở nhiệm vụ " + m.getCode(), text, m, me);
        return toDetail(m, me);
    }

    // ---------------------------------------------------------------- rules

    /** Proposer, approver, follower, or manager of the mission's unit; otherwise 404. */
    private Mission visible(String code, User me) {
        Mission m = missions.findByCode(code).orElseThrow(() -> new NotFoundException("Không tìm thấy nhiệm vụ " + code));
        if (involved(m, me)) return m;
        throw new NotFoundException("Không tìm thấy nhiệm vụ " + code);
    }

    private boolean involved(Mission m, User me) {
        return Objects.equals(m.getProposerUserId(), me.getId()) || Objects.equals(m.getApproverUserId(), me.getId())
                || followerIds(m).contains(me.getId()) || authorization.managedUnitIds(me).contains(m.getDepartmentId());
    }

    /** Fields of the form (BA): name, unit / team, project, due date, content. Not the code, people or status. */
    private void apply(Mission m, SaveMissionCommand c, User me) {
        String title = required(c.getTitle(), "Vui lòng nhập tên nhiệm vụ");
        Long myUnit = me.getOrgUnit() == null ? null : me.getOrgUnit().getId();
        Long unit = c.getDepartmentId() == null ? myUnit : c.getDepartmentId();
        if (unit == null) throw new IllegalArgumentException("Vui lòng chọn đơn vị / tổ đội");
        if (myUnit == null || !authorization.subtreeUnitIds(myUnit).contains(unit)) {
            throw new IllegalArgumentException("Đơn vị / tổ đội phải là đơn vị của bạn hoặc tổ đội thuộc đơn vị đó");
        }
        Project p = c.getProjectCode() == null || c.getProjectCode().isBlank() ? null : projectAccess.visible(c.getProjectCode().trim(), me);
        LocalDate due = c.getDueDate();
        if (due == null) throw new IllegalArgumentException("Vui lòng chọn hạn hoàn thành");
        if (due.isBefore(LocalDate.now())) throw new IllegalArgumentException("Hạn hoàn thành không được trước hôm nay");
        if (p != null && due.isAfter(p.getEndDate())) throw new IllegalArgumentException("Hạn hoàn thành không được quá hạn dự án");
        m.setTitle(title).setDepartmentId(unit).setProjectId(p == null ? null : p.getId()).setDueDate(due).setContent(blankToNull(c.getContent()));
    }

    /** Equipment (from the equipment catalogue, each must exist) and followers. */
    private void saveLists(Mission m, SaveMissionCommand c, User me) {
        List<Long> devices = c.getEquipmentIds() == null ? List.of() : c.getEquipmentIds().stream().filter(Objects::nonNull).distinct().toList();
        catalog.require(devices);
        equipment.replaceEquipment(m.getId(), devices);
        Set<Long> follow = new LinkedHashSet<>(c.getFollowerUserIds() == null ? List.of() : c.getFollowerUserIds());
        follow.remove(me.getId());
        follow.remove(m.getApproverUserId());
        for (Long id : follow) {
            User u = users.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người phối hợp " + id));
            if (Boolean.FALSE.equals(u.getActive()) || Boolean.TRUE.equals(u.getIsDeleted())) throw new IllegalArgumentException("Không tìm thấy người phối hợp " + id);
        }
        followers.replaceFollowers(m.getId(), follow);
    }

    private static void requireProposer(Mission m, User me) {
        if (!Objects.equals(m.getProposerUserId(), me.getId())) throw new AccessDeniedException("Chỉ người lập nhiệm vụ được làm thao tác này");
    }

    private static void requireApprover(Mission m, User me) {
        if (!Objects.equals(m.getApproverUserId(), me.getId())) throw new AccessDeniedException("Chỉ người duyệt nhiệm vụ được làm thao tác này");
    }

    private static void requireStatus(Mission m, MissionStatus status, String message) {
        if (m.getStatus() != status) throw new ConflictException(message);
    }

    private static String required(String value, String message) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(message);
        return value.trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private MissionDetailDTO transition(Mission m, User me, MissionAction action, MissionStatus to, String note, Collection<Long> tell, String what) {
        MissionStatus from = m.getStatus();
        m.setStatus(to);
        m.setUpdatedBy(me.getId());
        Mission saved = missions.save(m);
        log(saved, me, action, from, to, blankToNull(note));
        changed(saved);
        notify(tell, "Nhiệm vụ " + saved.getCode() + " " + what, blankToNull(note) == null ? saved.getTitle() : note.trim(), saved, me);
        return toDetail(saved, me);
    }

    private void log(Mission m, User me, MissionAction action, MissionStatus from, MissionStatus to, String note) {
        activities.save(new MissionActivity().setMissionId(m.getId()).setActorUserId(me.getId()).setAction(action)
                .setFromStatus(from == null ? null : from.name()).setToStatus(to == null ? null : to.name())
                .setProgress(m.getProgress()).setNote(note).setCreatedAt(LocalDateTime.now()));
    }

    private List<Long> followerIds(Mission m) {
        return followers.findByMissionId(m.getId()).stream().map(MissionFollower::getUserId).toList();
    }

    private static List<Long> union(Collection<Long> a, Collection<Long> b) {
        Set<Long> all = new LinkedHashSet<>(a);
        all.addAll(b);
        return new ArrayList<>(all);
    }

    // ---------------------------------------------------------------- mapping

    private MissionDetailDTO toDetail(Mission m, User me) {
        Map<Long, Department> units = units();
        LocalDate today = LocalDate.now();
        MissionDetailDTO dto = fillSummary(new MissionDetailDTO(), m, units, today);
        dto.setContent(m.getContent());
        dto.setEquipmentIds(equipment.findByMissionId(m.getId()).stream().map(MissionEquipment::getEquipmentId).toList());
        dto.setEquipment(catalog.refsOf(dto.getEquipmentIds()));
        dto.setFollowers(followerIds(m).stream().map(this::personOf).filter(Objects::nonNull).toList());
        dto.setEvidence(m.getEvidence());
        dto.setDecisionNote(m.getDecisionNote());
        dto.setDecidedAt(m.getDecidedAt());
        dto.setCompletedAt(m.getCompletedAt());
        dto.setComments(comments.findByMissionId(m.getId()).stream().map(c -> {
            TaskCommentDTO cd = new TaskCommentDTO();
            cd.setId(c.getId());
            cd.setUser(personOf(c.getUserId()));
            Department d = c.getDepartmentId() == null ? null : units.get(c.getDepartmentId());
            cd.setDepartmentName(d == null ? null : d.getName());
            cd.setContent(c.getContent());
            cd.setCreatedAt(c.getCreatedAt());
            return cd;
        }).toList());
        boolean proposer = Objects.equals(m.getProposerUserId(), me.getId()), approver = Objects.equals(m.getApproverUserId(), me.getId());
        dto.setAllowedActions(MissionRules.allowedActions(m, new MissionRules.Viewer(proposer, approver, involved(m, me))));
        dto.setAtRisk(MissionRules.atRisk(m, today));
        return dto;
    }

    private <T extends MissionSummaryDTO> T fillSummary(T dto, Mission m, Map<Long, Department> units, LocalDate today) {
        dto.setCode(m.getCode());
        dto.setTitle(m.getTitle());
        dto.setStatus(m.getStatus());
        dto.setDepartment(unit(units.get(m.getDepartmentId())));
        dto.setProposer(personOf(m.getProposerUserId()));
        dto.setApprover(personOf(m.getApproverUserId()));
        if (m.getProjectId() != null) {
            projects.findById(m.getProjectId()).ifPresent(p -> {
                ProjectRefDTO ref = new ProjectRefDTO();
                ref.setCode(p.getCode());
                ref.setName(p.getName());
                dto.setProject(ref);
            });
        }
        dto.setDueDate(m.getDueDate());
        dto.setOverdue(MissionRules.overdue(m, today));
        dto.setProgress(MissionRules.progress(m));
        return dto;
    }

    private Map<Long, Department> units() {
        return departments.findAll().stream().collect(Collectors.toMap(Department::getId, Function.identity()));
    }

    private PersonRefDTO personOf(Long userId) {
        return userId == null ? null : users.findById(userId).map(MissionAppServiceImpl::person).orElse(null);
    }

    private static PersonRefDTO person(User u) {
        PersonRefDTO dto = new PersonRefDTO();
        dto.setUserId(u.getId());
        dto.setFullName(u.getFullName());
        dto.setRoleCode(u.getRoleCode());
        dto.setDepartmentCode(u.getOrgUnit() == null ? null : u.getOrgUnit().getCode());
        return dto;
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

    private void changed(Mission m) {
        events.publishEvent(new CollectionChangedEvent(COLLECTION, List.of(m.getCode()), false));
    }

    private void notify(Collection<Long> recipients, String title, String body, Mission m, User me) {
        List<Long> to = recipients.stream().filter(Objects::nonNull).filter(id -> !id.equals(me.getId())).distinct().toList();
        if (to.isEmpty()) return;
        events.publishEvent(new WorkNotificationEvent(NOTIFY_TYPE, to, title, body, "projects/nhiem-vu/" + m.getCode(), m.getCode()));
    }
}
