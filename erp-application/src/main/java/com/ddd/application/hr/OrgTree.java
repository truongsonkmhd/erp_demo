package com.xxxx.ddd.application.hr;

import com.xxxx.ddd.domain.model.entity.Department;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Snapshot of the unit tree for one request: đơn vị (kind DON_VI) and the tổ/phòng under them. The frontend speaks
 * in unit codes (BLD, MD...) and tổ ids (MD-DIEN...), which are tbl_department.code.
 */
public final class OrgTree {
    /** Frontend SubUnitKind label of each tổ kind code. */
    static final Map<String, String> KIND_LABELS = Map.of(
            "PHONG", "Phòng", "TO", "Tổ", "DOI", "Đội", "XUONG", "Xưởng", "BO_PHAN", "Bộ phận");

    private final Map<Long, Department> byId = new HashMap<>();
    private final Map<String, Department> byCode = new HashMap<>();

    public OrgTree(Collection<Department> departments) {
        for (Department d : departments) {
            byId.put(d.getId(), d);
            byCode.put(d.getCode(), d);
        }
    }

    public Optional<Department> byCode(String code) {
        return Optional.ofNullable(code == null ? null : byCode.get(code));
    }

    public Department byId(Long id) {
        return id == null ? null : byId.get(id);
    }

    /** The đơn vị a department belongs to: itself, or the nearest DON_VI ancestor of a tổ. */
    public Department unitOf(Department d) {
        Department current = d;
        for (int guard = 0; current != null && !current.isUnit() && guard < 20; guard++) current = byId(current.getParentId());
        return current == null ? d : current;
    }

    public List<Department> units() {
        return byId.values().stream().filter(Department::isUnit)
                .sorted((a, b) -> a.getSortOrder() - b.getSortOrder() != 0 ? a.getSortOrder() - b.getSortOrder() : a.getId().compareTo(b.getId()))
                .toList();
    }

    public List<Department> subUnits() {
        return byId.values().stream().filter(d -> !d.isUnit())
                .sorted((a, b) -> a.getSortOrder() - b.getSortOrder() != 0 ? a.getSortOrder() - b.getSortOrder() : a.getId().compareTo(b.getId()))
                .toList();
    }

    public static String kindLabel(String code) {
        return KIND_LABELS.getOrDefault(code, "Tổ");
    }

    public static String kindCode(String label) {
        return KIND_LABELS.entrySet().stream().filter(e -> e.getValue().equals(label)).map(Map.Entry::getKey).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Loại tổ/phòng không hợp lệ: " + label));
    }
}
