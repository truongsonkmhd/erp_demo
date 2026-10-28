package com.xxxx.ddd.application.model.command;

import lombok.Data;

/** Cập nhật tiến độ. */
@Data
public class TaskProgressCommand {
    private Integer progress;
    private String evidence;
    private String note;
}
