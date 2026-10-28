package com.xxxx.ddd.application.hr;

import com.xxxx.ddd.application.exception.NotFoundException;
import com.xxxx.ddd.application.service.audit.AuditAppService;
import com.xxxx.ddd.application.service.security.CurrentActor;
import com.xxxx.ddd.application.vldc.CollectionChangedEvent;
import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.model.entity.hr.Employee;
import com.xxxx.ddd.domain.model.entity.hr.EmployeeCertificate;
import com.xxxx.ddd.domain.model.entity.hr.EmployeeTransfer;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.UserRepository;
import com.xxxx.ddd.domain.respository.hr.EmployeeRepository;
import com.xxxx.ddd.domain.respository.hr.EmployeeTransferRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Hồ sơ nhân sự (collection staff_profiles). A save is an upsert of the whole profile, as the page sends it:
 * a new id adds a person (vldc-hr:create), a changed unit/tổ is a transfer and is written to the history,
 * status NGHI_VIEC is leaving (vldc-hr:delete) and locks the person's account. Scope: HrScope.
 */
@Service
public class StaffAppService {
    public static final String COLLECTION = "staff_profiles";
    static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final EmployeeRepository employees;
    private final EmployeeTransferRepository transfers;
    private final DepartmentRepository departments;
    private final UserRepository users;
    private final HrScope scope;
    private final CurrentActor currentActor;
    private final AuditAppService audit;
    private final ApplicationEventPublisher events;

    public StaffAppService(EmployeeRepository employees, EmployeeTransferRepository transfers, DepartmentRepository departments,
                           UserRepository users, HrScope scope, CurrentActor currentActor, AuditAppService audit,
                           ApplicationEventPublisher events) {
        this.employees = employees;
        this.transfers = transfers;
        this.departments = departments;
        this.users = users;
        this.scope = scope;
        this.currentActor = currentActor;
        this.audit = audit;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public List<StaffProfileRow> findAll() {
        OrgTree tree = new OrgTree(departments.findAll());
        List<Employee> all = employees.findAllWithDetails();
        Map<Long, User> accounts = accounts(all);
        int year = LocalDate.now(ZONE).getYear();
        return all.stream().map(e -> toRow(e, tree, accounts.get(e.getUserId()), year)).toList();
    }

    @Transactional(readOnly = true)
    public List<TransferDTO> history(String code) {
        Employee e = employees.findByCode(code).orElseThrow(() -> new NotFoundException("Không có nhân sự " + code));
        OrgTree tree = new OrgTree(departments.findAll());
        return transfers.findByEmployee(e.getId()).stream()
                .map(t -> new TransferDTO(t.getEffectiveDate().toString(), label(tree, t.getFromDepartmentId()),
                        label(tree, t.getToDepartmentId()), t.getNote(), t.getCreatedBy()))
                .toList();
    }

    @Transactional
    public StaffProfileRow upsert(String id, StaffProfileRow row) {
        if (!id.equals(row.getId())) throw new IllegalArgumentException("Id in path and body differ");
        OrgTree tree = new OrgTree(departments.findAll());
        Department target = targetDepartment(tree, row);
        String actor = currentActor.username().orElse(null);
        LocalDateTime now = LocalDateTime.now(ZONE);
        int year = now.getYear();

        Employee e = employees.findByCode(id).orElse(null);
        boolean created = e == null;
        String before = created ? null : describe(e, tree);
        if (created) {
            scope.requireWholeOrg(HrScope.HR);
            e = new Employee().setCode(id).setCreatedAt(now).setStatus(Employee.WORKING);
        } else {
            scope.requireChange(HrScope.HR, e.getDepartment().getId());
        }
        scope.requireChange(HrScope.HR, target.getId());

        String nextStatus = row.getStatus() == null ? e.getStatus() : row.getStatus();
        boolean leaving = !Employee.LEFT.equals(e.getStatus()) && Employee.LEFT.equals(nextStatus);
        boolean returning = Employee.LEFT.equals(e.getStatus()) && !Employee.LEFT.equals(nextStatus);
        if ((leaving || returning) && !HrScope.has(HrScope.HR + ":delete")) throw new AccessDeniedException("Missing vldc-hr:delete");

        Department from = e.getDepartment();
        boolean moved = created || !Objects.equals(from.getId(), target.getId());
        int startYear = year - row.getExperience();
        if (!created && e.getWorkStartYear() != null && year - e.getWorkStartYear() == row.getExperience()) startYear = e.getWorkStartYear();

        e.setFullName(row.getName().trim()).setBirthYear(row.getBirthYear()).setEducation(row.getEducation())
                .setMajor(row.getMajor().trim()).setWorkStartYear(startYear).setTitle(row.getTitle().trim())
                .setDepartment(target).setOnField(row.isOnField()).setGender(blankToNull(row.getGender()))
                .setPhone(blankToNull(row.getPhone())).setEmail(blankToNull(row.getEmail())).setStatus(nextStatus)
                .setUpdatedAt(now).setUpdatedBy(actor);
        if (leaving) e.setLeftAt(row.getLeftAt() == null ? now.toLocalDate() : LocalDate.parse(row.getLeftAt()));
        if (returning) e.setLeftAt(null);
        replaceCertificates(e, row.getCerts());
        Employee saved = employees.save(e);

        Set<String> changedUnits = new LinkedHashSet<>();
        if (moved) {
            transfers.save(new EmployeeTransfer().setEmployeeId(saved.getId()).setFromDepartmentId(created ? null : from.getId())
                    .setToDepartmentId(target.getId()).setEffectiveDate(now.toLocalDate()).setNote(blankToNull(row.getTransferNote()))
                    .setCreatedBy(actor).setCreatedAt(now));
            // Heading a tổ ends with leaving it; the unit-level head/deputy stays while the person is still in the unit.
            changedUnits.addAll(releaseHeads(saved, tree, tree.unitOf(target), false));
            syncAccountUnit(saved, tree.unitOf(target));
        }
        if (leaving) {
            changedUnits.addAll(releaseHeads(saved, tree, null, true));
            lockAccount(saved);
        }

        audit.record(created ? "create" : leaving ? "terminate" : returning ? "reinstate" : moved ? "transfer" : "update",
                AuditAppService.EMPLOYEE, id, created ? describe(saved, tree) : before + " -> " + describe(saved, tree));
        events.publishEvent(new CollectionChangedEvent(COLLECTION, List.of(id), false));
        events.publishEvent(new CollectionChangedEvent(SkillAppService.COLLECTION, List.of(id), false));
        if (!changedUnits.isEmpty()) {
            events.publishEvent(new CollectionChangedEvent(OrgUnitAppService.SUB_UNITS, List.copyOf(changedUnits), false));
            events.publishEvent(new CollectionChangedEvent(OrgUnitAppService.ORG_UNITS, List.copyOf(changedUnits), false));
        }
        User account = saved.getUserId() == null ? null : users.findById(saved.getUserId()).orElse(null);
        return toRow(saved, tree, account, year);
    }

    StaffProfileRow toRow(Employee e, OrgTree tree, User account, int year) {
        Department unit = tree.unitOf(e.getDepartment());
        StaffProfileRow row = new StaffProfileRow();
        row.setId(e.getCode());
        row.setName(e.getFullName());
        row.setBirthYear(e.getBirthYear());
        row.setEducation(e.getEducation());
        row.setMajor(e.getMajor());
        row.setExperience(Math.max(0, year - e.getWorkStartYear()));
        row.setUnit(unit.getCode());
        row.setSubUnit(e.getDepartment().isUnit() ? "" : e.getDepartment().getCode());
        row.setTitle(e.getTitle());
        row.setOnField(e.isOnField());
        row.setGender(e.getGender());
        row.setPhone(e.getPhone());
        row.setEmail(e.getEmail());
        row.setStatus(e.getStatus());
        row.setLeftAt(e.getLeftAt() == null ? null : e.getLeftAt().toString());
        row.setCerts(e.getCertificates().stream().map(c -> {
            StaffProfileRow.Certificate cert = new StaffProfileRow.Certificate();
            cert.setName(c.getName());
            cert.setExpiry(c.getExpiresAt() == null ? "" : c.getExpiresAt().toString());
            cert.setNumber(c.getNumber());
            cert.setIssuedBy(c.getIssuedBy());
            return cert;
        }).collect(Collectors.toCollection(ArrayList::new)));
        if (account != null && !Boolean.TRUE.equals(account.getIsDeleted())) {
            row.setAccount(account.getUsername());
            row.setAccountActive(!Boolean.FALSE.equals(account.getActive()));
        }
        return row;
    }

    /** The tổ when one is given (it must be active and inside the unit), else the unit itself. */
    private Department targetDepartment(OrgTree tree, StaffProfileRow row) {
        Department unit = tree.byCode(row.getUnit()).filter(Department::isUnit)
                .orElseThrow(() -> new IllegalArgumentException("Đơn vị không tồn tại: " + row.getUnit()));
        if (row.getSubUnit() == null || row.getSubUnit().isBlank()) return unit;
        Department sub = tree.byCode(row.getSubUnit()).filter(d -> !d.isUnit())
                .orElseThrow(() -> new IllegalArgumentException("Tổ/phòng không tồn tại: " + row.getSubUnit()));
        if (!Objects.equals(tree.unitOf(sub).getId(), unit.getId())) throw new IllegalArgumentException("Tổ/phòng không thuộc đơn vị " + unit.getCode());
        if (!Boolean.TRUE.equals(sub.getActive())) throw new IllegalArgumentException("Tổ/phòng đã giải thể");
        return sub;
    }

    private void replaceCertificates(Employee e, List<StaffProfileRow.Certificate> certs) {
        e.getCertificates().clear();
        for (StaffProfileRow.Certificate c : certs == null ? List.<StaffProfileRow.Certificate>of() : certs) {
            e.getCertificates().add(new EmployeeCertificate().setEmployee(e).setName(c.getName().trim())
                    .setNumber(blankToNull(c.getNumber())).setIssuedBy(blankToNull(c.getIssuedBy()))
                    .setExpiresAt(c.getExpiry() == null || c.getExpiry().isBlank() ? null : LocalDate.parse(c.getExpiry())));
        }
    }

    /**
     * Clears the head/deputy posts the person may no longer hold: every one when leaving, otherwise the tổ they no
     * longer belong to and any unit other than keepUnit. Returns the codes of the departments that changed.
     */
    private List<String> releaseHeads(Employee e, OrgTree tree, Department keepUnit, boolean all) {
        List<String> changed = new ArrayList<>();
        for (Department d : departments.findAll()) {
            boolean head = Objects.equals(d.getHeadEmployeeId(), e.getId());
            boolean deputy = Objects.equals(d.getDeputyEmployeeId(), e.getId());
            if (!head && !deputy) continue;
            boolean stillThere = d.isUnit() ? keepUnit != null && Objects.equals(d.getId(), keepUnit.getId())
                    : Objects.equals(d.getId(), e.getDepartment().getId());
            if (!all && stillThere) continue;
            if (head) d.setHeadEmployeeId(null);
            if (deputy) d.setDeputyEmployeeId(null);
            departments.save(d);
            changed.add(d.getCode());
        }
        return changed;
    }

    /** A linked account follows its owner to the new đơn vị (never to a tổ: scope is per unit). */
    private void syncAccountUnit(Employee e, Department unit) {
        if (e.getUserId() == null) return;
        users.findById(e.getUserId()).ifPresent(u -> {
            if (u.getOrgUnit() == null || !Objects.equals(u.getOrgUnit().getId(), unit.getId())) {
                u.setOrgUnit(unit);
                u.setUpdatedAt(LocalDateTime.now(ZONE));
                users.save(u);
                audit.record("update-access", AuditAppService.USER, u.getId(), "unit=" + unit.getCode() + " (điều chuyển " + e.getCode() + ")");
            }
        });
    }

    /** Leaving locks the account at once: JwtAuthenticationFilter reloads the user and refuses an inactive one. */
    private void lockAccount(Employee e) {
        if (e.getUserId() == null) return;
        users.findById(e.getUserId()).ifPresent(u -> {
            if (u.getRoles() != null && u.getRoles().stream().anyMatch(r -> r.isAdmin())) return;
            if (!Boolean.FALSE.equals(u.getActive())) {
                u.setActive(false);
                u.setUpdatedAt(LocalDateTime.now(ZONE));
                users.save(u);
                audit.record("lock", AuditAppService.USER, u.getId(), "Nghỉ việc " + e.getCode());
            }
        });
    }

    private Map<Long, User> accounts(List<Employee> all) {
        Map<Long, User> result = new HashMap<>();
        for (Employee e : all) {
            if (e.getUserId() != null) users.findById(e.getUserId()).ifPresent(u -> result.put(u.getId(), u));
        }
        return result;
    }

    static String label(OrgTree tree, Long departmentId) {
        Department d = tree.byId(departmentId);
        if (d == null) return "";
        if (d.isUnit()) return d.getName();
        return d.getName() + " – " + tree.unitOf(d).getName();
    }

    private static String describe(Employee e, OrgTree tree) {
        return "unit=" + e.getDepartment().getCode() + " title=" + e.getTitle() + " status=" + e.getStatus()
                + " certs=" + e.getCertificates().size();
    }

    static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
