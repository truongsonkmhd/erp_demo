package com.xxxx.ddd.application.vldc.science;

import com.xxxx.ddd.application.service.security.CurrentActor;
import com.xxxx.ddd.application.vldc.AbstractCollectionService;
import com.xxxx.ddd.application.vldc.files.FileOwner;
import com.xxxx.ddd.application.vldc.files.VldcFileStorage;
import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.Role;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.model.entity.vldc.ScienceTopic;
import com.xxxx.ddd.domain.model.entity.vldc.ScienceTopicLog;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.vldc.ScienceTopicRepository;
import com.xxxx.ddd.domain.service.AuthorizationService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * Đề tài KH-CN & Đổi mới. Same rule as canViewTopic in scienceCore.ts, enforced here so a client cannot read
 * outside its scope: accepted topics are public; the others are seen by leadership (every unit), by the units the
 * caller works in or manages, and by the topic's own lead and members.
 */
@Service
public class ScienceTopicCollectionService extends AbstractCollectionService<ScienceTopicRow, ScienceTopic> implements FileOwner {
    private static final String LEADER_ROLE = "lanhdao";
    private static final String LEADER_POSITION = "LANH_DAO";

    private final ScienceTopicRepository repository;
    private final CurrentActor actor;
    private final AuthorizationService authorization;
    private final DepartmentRepository departments;
    private final VldcFileStorage files;

    public ScienceTopicCollectionService(ScienceTopicRepository repository, CurrentActor actor, AuthorizationService authorization,
                                         DepartmentRepository departments, VldcFileStorage files) {
        super(repository);
        this.repository = repository;
        this.actor = actor;
        this.authorization = authorization;
        this.departments = departments;
        this.files = files;
    }

    public String type() { return name(); }

    @Transactional(readOnly = true)
    public boolean canRead(String ownerId) {
        return repository.findById(ownerId).map(this::toRow).filter(visibility()).isPresent();
    }

    /**
     * Same as canAttachFiles in scienceCore.ts: everyone who sees the topic (lead, members, its unit, leadership)
     * may hand in documents until it is accepted; an accepted topic is closed (admin only).
     */
    @Transactional(readOnly = true)
    public boolean canWrite(String ownerId) {
        User user = actor.find().orElse(null);
        ScienceTopicRow topic = repository.findById(ownerId).map(this::toRow).orElse(null);
        if (user == null || topic == null) return false;
        if (user.getRoles().stream().anyMatch(Role::isAdmin)) return true;
        return !ScienceTopicRow.ACCEPTED.equals(topic.getStatus()) && visibility().test(topic);
    }

    @Transactional
    public void attach(String ownerId, List<String> urls) {
        ScienceTopicRow row = repository.findById(ownerId).map(this::toRow)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đề tài " + ownerId));
        List<String> attachments = new ArrayList<>(row.getAttachments());
        attachments.addAll(urls);
        row.setAttachments(attachments);
        upsert(row, actor.username().orElse(null));
    }

    @Transactional(readOnly = true)
    public List<String> attachments(String ownerId) {
        return repository.findById(ownerId).map(t -> List.copyOf(t.getAttachments())).orElse(List.of());
    }

    public String name() { return "science_topics"; }

    public Class<ScienceTopicRow> rowType() { return ScienceTopicRow.class; }

    /** Only the topics the signed-in user may see. */
    @Override
    @Transactional(readOnly = true)
    public List<ScienceTopicRow> findAll() {
        Predicate<ScienceTopicRow> visible = visibility();
        return super.findAll().stream().filter(visible).toList();
    }

    /** A topic outside the caller's scope cannot be overwritten (new topics are always allowed). */
    @Override
    @Transactional
    public ScienceTopicRow upsert(ScienceTopicRow row, String actorName) {
        Predicate<ScienceTopicRow> visible = visibility();
        ScienceTopicRow existing = repository.findById(row.getId()).map(this::toRow).orElse(null);
        if (existing != null && !visible.test(existing)) throw new AccessDeniedException("Topic outside your unit: " + row.getId());
        ScienceTopicRow saved = super.upsert(row, actorName);
        if (existing != null) deleteRemovedFiles(existing.getAttachments(), row.getAttachments(), row.getId());
        return saved;
    }

    /** Files dropped from the topic are removed from disk once the save has committed. */
    private void deleteRemovedFiles(List<String> before, List<String> after, String topicId) {
        List<VldcFileStorage.FileRef> removed = before.stream()
                .filter(url -> !after.contains(url))
                .map(VldcFileStorage::parse).flatMap(java.util.Optional::stream)
                .filter(ref -> ref.type().equals(name()) && ref.ownerId().equals(topicId))
                .toList();
        if (removed.isEmpty()) return;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                removed.forEach(files::delete);
            }
        });
    }

    private Predicate<ScienceTopicRow> visibility() {
        User user = actor.find().orElse(null);
        if (user == null) return topic -> false;
        Set<String> roles = user.getRoles().stream().map(Role::getCode).collect(Collectors.toSet());
        boolean admin = user.getRoles().stream().anyMatch(Role::isAdmin);
        boolean leader = roles.contains(LEADER_ROLE)
                || (user.getPosition() != null && LEADER_POSITION.equals(user.getPosition().getCode()));
        if (admin || leader) return topic -> true;
        Set<String> units = unitCodes(user);
        return topic -> ScienceTopicRow.ACCEPTED.equals(topic.getStatus())
                || units.contains(topic.getUnit())
                || roles.contains(topic.getLeadRole())
                || topic.getMembers().stream().anyMatch(roles::contains);
    }

    /** Codes of the user's own unit and of every unit they manage. */
    private Set<String> unitCodes(User user) {
        Set<Long> ids = new HashSet<>(authorization.managedUnitIds(user));
        if (user.getOrgUnit() != null) ids.add(user.getOrgUnit().getId());
        if (ids.isEmpty()) return Set.of();
        Map<Long, String> codes = departments.findAll().stream()
                .filter(d -> d.getCode() != null)
                .collect(Collectors.toMap(Department::getId, Department::getCode));
        return ids.stream().map(codes::get).filter(code -> code != null).collect(Collectors.toSet());
    }

    protected ScienceTopic toEntity(ScienceTopicRow row, ScienceTopic existing) {
        ScienceTopic topic = existing != null ? existing : new ScienceTopic();
        topic.setId(row.getId());
        ScienceTopicRow.ReviewRow review = row.getReview();
        List<ScienceTopicLog> log = row.getLog().stream().map(l -> new ScienceTopicLog()
                .setAt(l.getAt()).setByRole(l.getBy()).setByName(l.getByName()).setProgress(l.getProgress()).setNote(l.getNote()))
                .collect(Collectors.toCollection(ArrayList::new));
        topic.getLog().clear();
        topic.getLog().addAll(log);
        return topic.setTitle(row.getTitle())
                .setField(row.getField())
                .setUnit(row.getUnit())
                .setSubUnit(row.getSubUnit())
                .setObjective(row.getObjective())
                .setLeadRole(row.getLeadRole())
                .setLeadName(row.getLeadName())
                .setMembers(new ArrayList<>(row.getMembers()))
                .setStartDate(row.getStart())
                .setEndDate(row.getEnd())
                .setBudget(row.getBudget())
                .setSpent(row.getSpent())
                .setAttachments(new ArrayList<>(row.getAttachments()))
                .setProgress(row.getProgress())
                .setStatus(row.getStatus())
                .setResult(row.getResult())
                .setImpact(row.getImpact())
                .setSubmittedAt(row.getSubmittedAt())
                .setApprovedAt(row.getApprovedAt())
                .setReviewBy(review == null ? null : review.getBy())
                .setReviewAt(review == null ? null : review.getAt())
                .setReviewDecision(review == null ? null : review.getDecision())
                .setReviewNote(review == null ? null : review.getNote())
                .setTopicCreatedAt(row.getCreatedAt());
    }

    protected ScienceTopicRow toRow(ScienceTopic topic) {
        ScienceTopicRow row = new ScienceTopicRow();
        row.setId(topic.getId());
        row.setTitle(topic.getTitle());
        row.setField(topic.getField());
        row.setUnit(topic.getUnit());
        row.setSubUnit(topic.getSubUnit());
        row.setObjective(topic.getObjective());
        row.setLeadRole(topic.getLeadRole());
        row.setLeadName(topic.getLeadName());
        row.setMembers(new ArrayList<>(topic.getMembers()));
        row.setStart(topic.getStartDate());
        row.setEnd(topic.getEndDate());
        row.setBudget(topic.getBudget());
        row.setSpent(topic.getSpent());
        row.setAttachments(new ArrayList<>(topic.getAttachments()));
        row.setProgress(topic.getProgress());
        row.setLog(topic.getLog().stream().map(l -> {
            ScienceTopicRow.LogRow r = new ScienceTopicRow.LogRow();
            r.setAt(l.getAt());
            r.setBy(l.getByRole());
            r.setByName(l.getByName());
            r.setProgress(l.getProgress());
            r.setNote(l.getNote());
            return r;
        }).collect(Collectors.toCollection(ArrayList::new)));
        row.setStatus(topic.getStatus());
        row.setResult(topic.getResult());
        row.setImpact(topic.getImpact());
        row.setSubmittedAt(topic.getSubmittedAt());
        row.setApprovedAt(topic.getApprovedAt());
        if (topic.getReviewDecision() != null) {
            ScienceTopicRow.ReviewRow review = new ScienceTopicRow.ReviewRow();
            review.setBy(topic.getReviewBy());
            review.setAt(topic.getReviewAt());
            review.setDecision(topic.getReviewDecision());
            review.setNote(topic.getReviewNote());
            row.setReview(review);
        }
        row.setCreatedAt(topic.getTopicCreatedAt());
        return row;
    }
}
