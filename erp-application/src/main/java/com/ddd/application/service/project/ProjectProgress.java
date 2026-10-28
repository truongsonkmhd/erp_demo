package com.xxxx.ddd.application.service.project;

import com.xxxx.ddd.domain.model.entity.work.Project;
import com.xxxx.ddd.domain.model.entity.work.ProjectTask;
import com.xxxx.ddd.domain.model.enums.work.ProjectStatus;
import com.xxxx.ddd.domain.model.enums.work.TaskStatus;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Số liệu tính của một dự án (không lưu): tiến độ theo độ phức tạp (docs/cong-thuc-tien-do-du-an.md), số ngày trễ dự
 * báo, số việc đang mở và quá hạn.
 */
public record ProjectProgress(int progress, int delayDays, int openTaskCount, int overdueTaskCount) {

    /** tasks: the project's live (not deleted) tasks, sub-tasks included. */
    public static ProjectProgress of(Project project, List<ProjectTask> tasks, LocalDate today) {
        boolean completed = project.getStatus() == ProjectStatus.COMPLETED;
        List<ProjectTask> topLevel = tasks.stream().filter(t -> t.getParentId() == null).toList();
        int total = topLevel.stream().mapToInt(t -> t.getComplexity().weight()).sum();
        int done = topLevel.stream().filter(t -> t.getStatus() == TaskStatus.DONE).mapToInt(t -> t.getComplexity().weight()).sum();
        int progress = completed ? 100 : total == 0 ? 0 : (int) Math.round(done * 100.0 / total);

        int open = (int) tasks.stream().filter(t -> t.getStatus() != TaskStatus.DONE).count();
        int overdue = (int) tasks.stream().filter(t -> t.getStatus() != TaskStatus.DONE && t.getDueDate().isBefore(today)).count();
        return new ProjectProgress(progress, completed ? 0 : delayDays(project, progress, today), open, overdue);
    }

    /** max(days past the end date, linear forecast: at the pace so far, how much longer than planned the project takes). */
    private static int delayDays(Project project, int progress, LocalDate today) {
        LocalDate start = project.getStartDate(), end = project.getEndDate();
        long span = Math.max(1, ChronoUnit.DAYS.between(start, end));
        long elapsed = Math.max(0, ChronoUnit.DAYS.between(start, today));
        long overdue = Math.max(0, ChronoUnit.DAYS.between(end, today));
        long forecast = progress > 0 && elapsed > 0 ? Math.max(0, Math.round(elapsed * 100.0 / progress) - span) : 0;
        return (int) Math.max(overdue, forecast);
    }
}
