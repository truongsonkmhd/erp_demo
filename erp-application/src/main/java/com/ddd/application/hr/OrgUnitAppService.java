package com.xxxx.ddd.application.hr;

import com.xxxx.ddd.application.exception.NotFoundException;
import com.xxxx.ddd.application.service.audit.AuditAppService;
import com.xxxx.ddd.application.vldc.CollectionChangedEvent;
import com.xxxx.ddd.domain.model.entity.Department;
import com.xxxx.ddd.domain.model.entity.hr.Employee;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.hr.EmployeeRepository;
import com.xxxx.ddd.domain.service.AuthorizationService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Phòng ban: the đơn vị (collection org_units: name, nhiệm vụ, trưởng/phó) and their tổ/phòng (collection sub_units:
 * add, edit, dissolve). Both live in tbl_department. Adding a tổ, or changing a unit other than one the actor
 * manages, needs vldc-organization:create; heads change their own unit with vldc-organization:update (HrScope).
 */
@Service
public class OrgUnitAppService {
    public static final String ORG_UNITS = "org_units";
    public static final String SUB_UNITS = "sub_units";
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final DepartmentRepository departments;
    private final EmployeeRepository employees;
    private final AuthorizationService authorization;
    private final HrScope scope;
    private final AuditAppService audit;
    private final ApplicationEventPublisher events;

    public OrgUnitAppService(DepartmentRepository departments, EmployeeRepository employees, AuthorizationService authorization,
                             HrScope scope, AuditAppService audit, ApplicationEventPublisher events) {
        this.departments = departments;
        this.employees = employees;
        this.authorization = authorization;
        this.scope = scope;
        this.audit = audit;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public List<OrgUnitRow> units() {
        OrgTree tree = new OrgTree(departments.findAll());
        Map<Long, Employee> people = employees.findAllWithDetails().stream().collect(Collectors.toMap(Employee::getId, Function.identity()));
        return tree.units().stream().filter(d -> Boolean.TRUE.equals(d.getActive())).map(d -> toUnitRow(d, people)).toList();
    }

    @Transactional(readOnly = true)
    public List<SubUnitRow> subUnits() {
        OrgTree tree = new OrgTree(departments.findAll());
        Map<Long, String> codes = employees.findAllWithDetails().stream().collect(Collectors.toMap(Employee::getId, Employee::getCode));
        return tree.subUnits().stream().map(d -> toSubRow(d, tree, codes)).toList();
    }

    @Transactional
    public OrgUnitRow saveUnit(String code, OrgUnitRow row) {
        if (!code.equals(row.getId())) throw new IllegalArgumentException("Id in path and body differ");
        Department unit = departments.findByCode(code).filter(Department::isUnit)
                .orElseThrow(() -> new NotFoundException("Không có đơn vị " + code));
        scope.requireChange(HrScope.ORG, unit.getId());
        Set<Long> inUnit = authorization.subtreeUnitIds(unit.getId());
        String before = describe(unit);
        unit.setName(row.getName().trim());
        unit.setUnitType(StaffAppService.blankToNull(row.getType()));
        unit.setMission(StaffAppService.blankToNull(row.getMission()));
        unit.setHeadEmployeeId(memberId(row.getHeadId(), inUnit));
        unit.setDeputyEmployeeId(memberId(row.getDeputyId(), inUnit));
        if (unit.getHeadEmployeeId() != null && unit.getHeadEmployeeId().equals(unit.getDeputyEmployeeId())) {
            throw new IllegalArgumentException("Trưởng và phó đơn vị phải là hai người khác nhau");
        }
        departments.save(unit);
        audit.record("update", AuditAppService.ORG_UNIT, code, before + " -> " + describe(unit));
        events.publishEvent(new CollectionChangedEvent(ORG_UNITS, List.of(code), false));
        Map<Long, Employee> people = employees.findAllWithDetails().stream().collect(Collectors.toMap(Employee::getId, Function.identity()));
        return toUnitRow(unit, people);
    }

    @Transactional
    public SubUnitRow saveSubUnit(String id, SubUnitRow row) {
        if (!id.equals(row.getId())) throw new IllegalArgumentException("Id in path and body differ");
        OrgTree tree = new OrgTree(departments.findAll());
        Department unit = tree.byCode(row.getUnit()).filter(Department::isUnit)
                .orElseThrow(() -> new IllegalArgumentException("Đơn vị không tồn tại: " + row.getUnit()));
        Department sub = tree.byCode(id).orElse(null);
        boolean created = sub == null;
        if (created) {
            scope.requireChange(HrScope.ORG, unit.getId());
            sub = new Department().setCode(id).setParentId(unit.getId()).setActive(true).setCreatedAt(LocalDateTime.now(StaffAppService.ZONE))
                    .setSortOrder(1000);
        } else {
            if (sub.isUnit()) throw new IllegalArgumentException(id + " là đơn vị, không phải tổ/phòng");
            if (!Objects.equals(tree.unitOf(sub).getId(), unit.getId())) throw new IllegalArgumentException("Không chuyển tổ/phòng sang đơn vị khác");
            scope.requireChange(HrScope.ORG, sub.getId());
        }
        String name = row.getName().trim();
        String key = name.toLowerCase(Locale.ROOT);
        Department self = sub;
        boolean duplicate = tree.subUnits().stream().anyMatch(d -> d != self && !d.getCode().equals(id) && Boolean.TRUE.equals(d.getActive())
                && Objects.equals(d.getParentId(), unit.getId()) && d.getName().trim().toLowerCase(Locale.ROOT).equals(key));
        if (row.isActive() && duplicate) throw new IllegalArgumentException("Đơn vị đã có tổ/phòng cùng tên");

        String before = created ? null : describe(sub);
        boolean dissolving = !created && Boolean.TRUE.equals(sub.getActive()) && !row.isActive();
        if (dissolving) {
            long people = employees.countWorkingIn(List.of(sub.getId()));
            if (people > 0) throw new IllegalArgumentException("Chưa thể giải thể: còn " + people + " nhân sự");
            sub.setActive(false).setDissolvedAt(LocalDateTime.now(StaffAppService.ZONE)).setHeadEmployeeId(null);
        } else if (!created && !Boolean.TRUE.equals(sub.getActive()) && row.isActive()) {
            sub.setActive(true).setDissolvedAt(null);
        }
        sub.setName(name).setDescription(null).setKind(OrgTree.kindCode(row.getKind())).setMission(StaffAppService.blankToNull(row.getDuty()));
        if (Boolean.TRUE.equals(sub.getActive())) {
            Long head = memberId(row.getHeadId(), authorization.subtreeUnitIds(unit.getId()));
            sub.setHeadEmployeeId(head);
        }
        Department saved = departments.save(sub);
        List<String> changed = new ArrayList<>(List.of(id));
        // One person heads one tổ: the tổ they headed before loses its head.
        if (saved.getHeadEmployeeId() != null) {
            for (Department other : tree.subUnits()) {
                if (other != saved && !other.getCode().equals(id) && Objects.equals(other.getHeadEmployeeId(), saved.getHeadEmployeeId())) {
                    other.setHeadEmployeeId(null);
                    departments.save(other);
                    changed.add(other.getCode());
                }
            }
        }
        audit.record(created ? "create" : dissolving ? "dissolve" : "update", AuditAppService.ORG_UNIT, id,
                created ? describe(saved) : before + " -> " + describe(saved));
        events.publishEvent(new CollectionChangedEvent(SUB_UNITS, changed, false));
        events.publishEvent(new CollectionChangedEvent(ORG_UNITS, List.of(unit.getCode()), false));
        Map<Long, String> codes = employees.findAllWithDetails().stream().collect(Collectors.toMap(Employee::getId, Employee::getCode));
        return toSubRow(saved, new OrgTree(departments.findAll()), codes);
    }

    /** The profile's id when the person works in the unit (or one of its tổ); blank = nobody. */
    private Long memberId(String code, Set<Long> unitIds) {
        if (code == null || code.isBlank()) return null;
        Employee e = employees.findByCode(code).orElseThrow(() -> new IllegalArgumentException("Không có nhân sự " + code));
        if (e.hasLeft()) throw new IllegalArgumentException(e.getFullName() + " đã nghỉ việc");
        if (!unitIds.contains(e.getDepartment().getId())) throw new IllegalArgumentException(e.getFullName() + " không thuộc đơn vị này");
        return e.getId();
    }

    private OrgUnitRow toUnitRow(Department d, Map<Long, Employee> people) {
        Set<Long> ids = authorization.subtreeUnitIds(d.getId());
        long count = people.values().stream().filter(e -> !e.hasLeft() && ids.contains(e.getDepartment().getId())).count();
        Employee head = people.get(d.getHeadEmployeeId());
        Employee deputy = people.get(d.getDeputyEmployeeId());
        OrgUnitRow row = new OrgUnitRow();
        row.setId(d.getCode());
        row.setName(d.getName());
        row.setType(d.getUnitType() == null ? "" : d.getUnitType());
        row.setLeader(head == null ? "" : head.getFullName());
        if (deputy != null) row.setDeputy(deputy.getFullName());
        row.setHeadId(head == null ? null : head.getCode());
        row.setDeputyId(deputy == null ? null : deputy.getCode());
        row.setStaff(count + " người");
        row.setStaffCount((int) count);
        row.setMission(d.getMission() == null ? "" : d.getMission());
        row.setPublic(true);
        return row;
    }

    private SubUnitRow toSubRow(Department d, OrgTree tree, Map<Long, String> codes) {
        SubUnitRow row = new SubUnitRow();
        row.setId(d.getCode());
        row.setUnit(tree.unitOf(d).getCode());
        row.setName(d.getName());
        row.setKind(OrgTree.kindLabel(d.getKind()));
        row.setDuty(d.getMission() == null ? "" : d.getMission());
        row.setHeadId(codes.get(d.getHeadEmployeeId()));
        row.setActive(Boolean.TRUE.equals(d.getActive()));
        row.setCreatedAt(d.getCreatedAt() == null ? "" : d.getCreatedAt().format(ISO));
        if (d.getDissolvedAt() != null) row.setDissolvedAt(d.getDissolvedAt().format(ISO));
        return row;
    }

    private static String describe(Department d) {
        return "name=" + d.getName() + " head=" + d.getHeadEmployeeId() + " deputy=" + d.getDeputyEmployeeId() + " active=" + d.getActive();
    }
}
