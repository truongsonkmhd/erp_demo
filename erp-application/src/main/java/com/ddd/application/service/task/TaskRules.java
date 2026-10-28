package com.xxxx.ddd.application.service.task;

import com.xxxx.ddd.domain.model.entity.work.ProjectTask;
import com.xxxx.ddd.domain.model.enums.work.TaskStatus;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Luật thuần của việc dự án (không đụng DB): thao tác người xem được làm, tiến độ, cảnh báo nguy cơ trễ. Trưởng phòng
 * giao việc cho nhân viên đơn vị mình và nghiệm thu; nhân viên nhận, cập nhật tiến độ, nộp.
 */
public final class TaskRules {
    public static final String ACCEPT = "ACCEPT", PROGRESS = "PROGRESS", SUBMIT = "SUBMIT", APPROVE = "APPROVE", RETURN = "RETURN",
            COMMENT = "COMMENT", DELETE = "DELETE", MOVE = "MOVE";

    /** What the viewer is to the task: assignee (nhân viên), assigner (trưởng phòng giao việc), follower, sees the project. */
    public record Viewer(boolean assignee, boolean assigner, boolean participant, boolean seesProject) {
    }

    private TaskRules() {
    }

    public static List<String> allowedActions(ProjectTask t, Viewer v) {
        List<String> actions = new ArrayList<>();
        TaskStatus s = t.getStatus();
        if (v.assignee() && s == TaskStatus.NEW) actions.add(ACCEPT);
        if (v.assignee() && s == TaskStatus.IN_PROGRESS) {
            actions.add(PROGRESS);
            actions.add(SUBMIT);
        }
        if (v.assigner() && s == TaskStatus.IN_REVIEW) {
            actions.add(APPROVE);
            actions.add(RETURN);
        }
        if (v.participant() || v.seesProject()) actions.add(COMMENT);
        if (v.assigner()) {
            actions.add(MOVE);
            actions.add(DELETE);
        }
        return actions;
    }

    /** Done = 100; otherwise the progress the assignee entered. */
    public static int progress(ProjectTask t) {
        if (t.getStatus() == TaskStatus.DONE) return 100;
        return t.getProgress() == null ? 0 : t.getProgress();
    }

    public static boolean overdue(ProjectTask t, LocalDate today) {
        return t.getStatus() != TaskStatus.DONE && t.getDueDate().isBefore(today);
    }

    /** Open and overdue, or due within 2 days and under 80%. */
    public static boolean atRisk(ProjectTask t, LocalDate today) {
        if (t.getStatus() == TaskStatus.DONE) return false;
        return t.getDueDate().isBefore(today) || (!t.getDueDate().isAfter(today.plusDays(2)) && progress(t) < 80);
    }
}
