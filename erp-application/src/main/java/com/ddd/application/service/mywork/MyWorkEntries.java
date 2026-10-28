package com.xxxx.ddd.application.service.mywork;

import com.xxxx.ddd.application.model.PageDTO;
import com.xxxx.ddd.application.model.PageRequestParams;
import com.xxxx.ddd.application.model.work.WorkEntryDTO;
import com.xxxx.ddd.application.model.work.WorkItemDTO;
import com.xxxx.ddd.application.model.work.WorkProjectDTO;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Menu Công việc, phần thuần: gom dòng thành mục (thư mục dự án, nhiệm vụ đứng riêng), sắp theo hạn gần nhất rồi mã, cắt
 * trang theo mục để một thư mục không bị chia đôi giữa hai trang.
 */
public final class MyWorkEntries {
    public static final String PROJECT = "PROJECT", MISSION = "MISSION";
    public static final String PROJECT_APPROVAL = "PROJECT_APPROVAL", PROJECT_DELETE = "PROJECT_DELETE", PROJECT_ASSIGN = "PROJECT_ASSIGN",
            PROJECT_TASK = "PROJECT_TASK";
    public static final String APPROVE_PROJECT = "APPROVE_PROJECT", CONFIRM_DELETE = "CONFIRM_DELETE", ASSIGN_TASKS = "ASSIGN_TASKS",
            DO_TASK = "DO_TASK", REVIEW_TASK = "REVIEW_TASK", APPROVE_MISSION = "APPROVE_MISSION", DO_MISSION = "DO_MISSION", FOLLOW = "FOLLOW";

    private static final Comparator<LocalDate> DUE = Comparator.nullsLast(Comparator.naturalOrder());

    private MyWorkEntries() {
    }

    /**
     * rows: dòng đã lọc; projects: thư mục theo mã dự án; keepEmpty: thư mục vẫn hiện khi không còn dòng nào (tab Toàn Liên
     * đoàn hiện mọi dự án đang chạy).
     */
    public static PageDTO<WorkEntryDTO> page(List<WorkItemDTO> rows, Map<String, WorkProjectDTO> projects, Collection<String> keepEmpty,
                                             Integer pageNo, Integer pageSize) {
        List<WorkEntryDTO> all = entries(rows, projects, keepEmpty);
        Pageable p = PageRequestParams.of(pageNo, pageSize, Sort.unsorted());
        int from = (int) Math.min(p.getOffset(), all.size()), to = Math.min(from + p.getPageSize(), all.size());
        int pages = (all.size() + p.getPageSize() - 1) / p.getPageSize();
        return new PageDTO<>(all.subList(from, to), p.getPageNumber() + 1, p.getPageSize(), all.size(), pages);
    }

    public static List<WorkEntryDTO> entries(List<WorkItemDTO> rows, Map<String, WorkProjectDTO> projects, Collection<String> keepEmpty) {
        Map<String, List<WorkItemDTO>> folders = new LinkedHashMap<>();
        for (String code : keepEmpty) if (projects.containsKey(code)) folders.put(code, new ArrayList<>());
        List<WorkEntryDTO> entries = new ArrayList<>();
        for (WorkItemDTO r : rows) {
            if (MISSION.equals(r.getKind())) entries.add(entry(MISSION, null, List.of(r)));
            else folders.computeIfAbsent(r.getProjectCode(), k -> new ArrayList<>()).add(r);
        }
        folders.forEach((code, items) -> {
            items.sort(Comparator.comparing(WorkItemDTO::getDueDate, DUE).thenComparing(WorkItemDTO::getCode));
            entries.add(entry(PROJECT, projects.get(code), items));
        });
        entries.sort(Comparator.comparing(MyWorkEntries::nearestDue, DUE).thenComparing(MyWorkEntries::codeOf));
        return entries;
    }

    private static WorkEntryDTO entry(String kind, WorkProjectDTO project, List<WorkItemDTO> items) {
        WorkEntryDTO e = new WorkEntryDTO();
        e.setKind(kind);
        e.setProject(project);
        e.setItems(items);
        return e;
    }

    /** An empty folder sorts by the project's end date. */
    private static LocalDate nearestDue(WorkEntryDTO e) {
        LocalDate due = e.getItems().stream().map(WorkItemDTO::getDueDate).filter(Objects::nonNull).min(Comparator.naturalOrder()).orElse(null);
        return due != null || e.getProject() == null ? due : e.getProject().getEndDate();
    }

    private static String codeOf(WorkEntryDTO e) {
        return e.getProject() != null ? e.getProject().getCode() : e.getItems().get(0).getCode();
    }

    /** Mã hoặc tên dòng, hoặc mã / tên dự án của dòng, chứa từ khoá (không phân biệt hoa thường). */
    public static boolean matches(WorkItemDTO r, WorkProjectDTO project, String keyword) {
        if (keyword == null || keyword.isBlank()) return true;
        String q = keyword.trim().toLowerCase(Locale.ROOT);
        String text = r.getCode() + " " + r.getTitle() + (project == null ? "" : " " + project.getCode() + " " + project.getName());
        return text.toLowerCase(Locale.ROOT).contains(q);
    }

    /** Ô thống kê tab Của tôi: mine, overdue, today, cc. */
    public static Map<String, Integer> mineCounts(List<WorkItemDTO> rows, LocalDate today) {
        Map<String, Integer> c = new LinkedHashMap<>();
        c.put("mine", (int) rows.stream().filter(WorkItemDTO::isMine).count());
        c.put("overdue", (int) rows.stream().filter(WorkItemDTO::isOverdue).count());
        c.put("today", (int) rows.stream().filter(r -> today.equals(r.getDueDate())).count());
        c.put("cc", (int) rows.stream().filter(r -> FOLLOW.equals(r.getReason())).count());
        return c;
    }

    /** filter: mine, overdue, today, cc; khác (all / rỗng) lấy hết. */
    public static boolean mineFilter(WorkItemDTO r, String filter, LocalDate today) {
        if (filter == null) return true;
        return switch (filter) {
            case "mine" -> r.isMine();
            case "overdue" -> r.isOverdue();
            case "today" -> today.equals(r.getDueDate());
            case "cc" -> FOLLOW.equals(r.getReason());
            default -> true;
        };
    }

    /** Ô thống kê tab Toàn Liên đoàn: inProgress, overdue, atRisk, pending (nhiệm vụ chờ duyệt, việc chưa nhận). */
    public static Map<String, Integer> federationCounts(List<WorkItemDTO> rows) {
        Map<String, Integer> c = new LinkedHashMap<>();
        c.put("inProgress", (int) rows.stream().filter(r -> federationFilter(r, "IN_PROGRESS")).count());
        c.put("overdue", (int) rows.stream().filter(r -> federationFilter(r, "OVERDUE")).count());
        c.put("atRisk", (int) rows.stream().filter(r -> federationFilter(r, "AT_RISK")).count());
        c.put("pending", (int) rows.stream().filter(r -> federationFilter(r, "PENDING")).count());
        return c;
    }

    /** status: IN_PROGRESS (đang làm / chờ nghiệm thu), OVERDUE, AT_RISK, PENDING (NEW, chờ duyệt); rỗng lấy hết. */
    public static boolean federationFilter(WorkItemDTO r, String status) {
        if (status == null || status.isBlank()) return true;
        return switch (status) {
            case "IN_PROGRESS" -> "IN_PROGRESS".equals(r.getStatus()) || "IN_REVIEW".equals(r.getStatus());
            case "OVERDUE" -> r.isOverdue();
            case "AT_RISK" -> r.isAtRisk();
            case "PENDING" -> "NEW".equals(r.getStatus()) || "PENDING".equals(r.getStatus());
            default -> throw new IllegalArgumentException("Trạng thái lọc không hợp lệ: " + status);
        };
    }
}
