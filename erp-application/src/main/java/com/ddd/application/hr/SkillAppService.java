package com.xxxx.ddd.application.hr;

import com.xxxx.ddd.application.exception.NotFoundException;
import com.xxxx.ddd.application.service.audit.AuditAppService;
import com.xxxx.ddd.application.vldc.CollectionChangedEvent;
import com.xxxx.ddd.domain.model.entity.hr.Employee;
import com.xxxx.ddd.domain.model.entity.hr.EmployeeCertificate;
import com.xxxx.ddd.domain.model.entity.hr.EmployeeSkill;
import com.xxxx.ddd.domain.model.entity.hr.Skill;
import com.xxxx.ddd.domain.respository.DepartmentRepository;
import com.xxxx.ddd.domain.respository.hr.EmployeeRepository;
import com.xxxx.ddd.domain.respository.hr.SkillRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Skill matrix (collection staff_skills): one row per working person who has been assessed. A save sets the levels
 * 1–5 (0 = not assessed) of one person; changing them is vldc-hr:update inside the actor's scope.
 */
@Service
public class SkillAppService {
    public static final String COLLECTION = "staff_skills";

    private final EmployeeRepository employees;
    private final SkillRepository skills;
    private final DepartmentRepository departments;
    private final HrScope scope;
    private final AuditAppService audit;
    private final ApplicationEventPublisher events;

    public SkillAppService(EmployeeRepository employees, SkillRepository skills, DepartmentRepository departments, HrScope scope,
                           AuditAppService audit, ApplicationEventPublisher events) {
        this.employees = employees;
        this.skills = skills;
        this.departments = departments;
        this.scope = scope;
        this.audit = audit;
        this.events = events;
    }

    /** The skill columns of the matrix, in order. */
    @Transactional(readOnly = true)
    public List<SkillDTO> catalog() {
        return skills.findActive().stream().map(s -> new SkillDTO(s.getCode(), s.getName())).toList();
    }

    @Transactional(readOnly = true)
    public List<StaffSkillRow> findAll() {
        OrgTree tree = new OrgTree(departments.findAll());
        return employees.findAllWithDetails().stream().filter(e -> !e.hasLeft() && !e.getSkills().isEmpty())
                .map(e -> toRow(e, tree)).toList();
    }

    @Transactional
    public StaffSkillRow save(String code, StaffSkillRow row) {
        if (!code.equals(row.getId())) throw new IllegalArgumentException("Id in path and body differ");
        Employee e = employees.findByCode(code).orElseThrow(() -> new NotFoundException("Không có nhân sự " + code));
        if (e.hasLeft()) throw new IllegalArgumentException(e.getFullName() + " đã nghỉ việc");
        scope.requireChange(HrScope.HR, e.getDepartment().getId());

        Set<String> known = new HashSet<>(skills.findActive().stream().map(Skill::getCode).toList());
        Map<String, Integer> next = new LinkedHashMap<>(row.getLevels() == null ? Map.of() : row.getLevels());
        putLegacy(next, "geophysics", row.getGeophysics());
        putLegacy(next, "gis", row.getGis());
        putLegacy(next, "data", row.getData());
        putLegacy(next, "pm", row.getPm());
        for (Map.Entry<String, Integer> entry : next.entrySet()) {
            if (!known.contains(entry.getKey())) throw new IllegalArgumentException("Kỹ năng không tồn tại: " + entry.getKey());
            Integer level = entry.getValue();
            if (level == null || level < 0 || level > 5) throw new IllegalArgumentException("Mức kỹ năng phải từ 0 đến 5");
        }

        String actor = scopeActor();
        LocalDateTime now = LocalDateTime.now(StaffAppService.ZONE);
        Map<String, EmployeeSkill> current = new HashMap<>();
        e.getSkills().forEach(s -> current.put(s.getSkillCode(), s));
        StringBuilder detail = new StringBuilder();
        next.forEach((skill, level) -> {
            EmployeeSkill have = current.get(skill);
            int before = have == null ? 0 : have.getLevel();
            if (before == level) return;
            detail.append(skill).append('=').append(before).append("->").append(level).append(' ');
            if (level == 0) e.getSkills().remove(have);
            else if (have != null) have.setLevel(level).setUpdatedAt(now).setUpdatedBy(actor);
            else e.getSkills().add(new EmployeeSkill().setEmployee(e).setSkillCode(skill).setLevel(level).setUpdatedAt(now).setUpdatedBy(actor));
        });
        Employee saved = employees.save(e);
        if (!detail.isEmpty()) {
            audit.record("skills", AuditAppService.EMPLOYEE, code, detail.toString().trim());
            events.publishEvent(new CollectionChangedEvent(COLLECTION, List.of(code), false));
        }
        return toRow(saved, new OrgTree(departments.findAll()));
    }

    private static void putLegacy(Map<String, Integer> levels, String code, Integer level) {
        if (level != null) levels.put(code, level);
    }

    private static String scopeActor() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? null : auth.getName();
    }

    private StaffSkillRow toRow(Employee e, OrgTree tree) {
        Map<String, Integer> levels = new LinkedHashMap<>();
        e.getSkills().stream().sorted(Comparator.comparing(EmployeeSkill::getSkillCode)).forEach(s -> levels.put(s.getSkillCode(), s.getLevel()));
        StaffSkillRow row = new StaffSkillRow();
        row.setId(e.getCode());
        row.setName(e.getFullName());
        row.setUnit(tree.unitOf(e.getDepartment()).getName());
        row.setGeophysics(levels.getOrDefault("geophysics", 0));
        row.setGis(levels.getOrDefault("gis", 0));
        row.setData(levels.getOrDefault("data", 0));
        row.setPm(levels.getOrDefault("pm", 0));
        row.setOnField(e.isOnField());
        row.setCertExpiry(e.getCertificates().stream().map(EmployeeCertificate::getExpiresAt).filter(Objects::nonNull)
                .min(LocalDate::compareTo).map(LocalDate::toString).orElse(""));
        row.setLevels(levels);
        return row;
    }

    public record SkillDTO(String code, String name) {
    }
}
