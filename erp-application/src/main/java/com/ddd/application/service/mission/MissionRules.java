package com.xxxx.ddd.application.service.mission;

import com.xxxx.ddd.domain.model.entity.work.Mission;
import com.xxxx.ddd.domain.model.enums.work.MissionStatus;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Luật thuần của nhiệm vụ: người lập sửa khi còn chờ duyệt, cập nhật tiến độ và báo hoàn thành khi đang thực hiện;
 * người duyệt (cấp trên trực tiếp) duyệt hoặc từ chối khi chờ duyệt. Không có bước nghiệm thu.
 */
public final class MissionRules {
    public static final String APPROVE = "APPROVE", REJECT = "REJECT", EDIT = "EDIT", PROGRESS = "PROGRESS", COMPLETE = "COMPLETE",
            COMMENT = "COMMENT", DELETE = "DELETE";

    /** proposer = người lập; approver = người duyệt; involved = cũng là người phối hợp hoặc quản lý đơn vị. */
    public record Viewer(boolean proposer, boolean approver, boolean involved) {
    }

    private MissionRules() {
    }

    public static List<String> allowedActions(Mission m, Viewer v) {
        List<String> actions = new ArrayList<>();
        MissionStatus s = m.getStatus();
        if (v.approver() && s == MissionStatus.PENDING) {
            actions.add(APPROVE);
            actions.add(REJECT);
        }
        if (v.proposer() && s == MissionStatus.PENDING) actions.add(EDIT);
        if (v.proposer() && s == MissionStatus.IN_PROGRESS) {
            actions.add(PROGRESS);
            actions.add(COMPLETE);
        }
        if (v.proposer() || v.approver() || v.involved()) actions.add(COMMENT);
        if (v.proposer()) actions.add(DELETE);
        return actions;
    }

    public static int progress(Mission m) {
        if (m.getStatus() == MissionStatus.DONE) return 100;
        return m.getProgress() == null ? 0 : m.getProgress();
    }

    /** Waiting or under way and past due. */
    public static boolean overdue(Mission m, LocalDate today) {
        boolean open = m.getStatus() == MissionStatus.PENDING || m.getStatus() == MissionStatus.IN_PROGRESS;
        return open && m.getDueDate().isBefore(today);
    }

    /** Under way and overdue, or due within 2 days and under 80%. */
    public static boolean atRisk(Mission m, LocalDate today) {
        if (m.getStatus() != MissionStatus.IN_PROGRESS) return false;
        return m.getDueDate().isBefore(today) || (!m.getDueDate().isAfter(today.plusDays(2)) && progress(m) < 80);
    }
}
