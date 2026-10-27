package com.xxxx.ddd.application.model.work;

import java.util.List;
import lombok.Data;

/** Một mục cấp ngoài của menu Công việc: thư mục dự án (kind PROJECT, các dòng của nó) hoặc một nhiệm vụ (kind MISSION, một dòng). */
@Data
public class WorkEntryDTO {
    private String kind;
    private WorkProjectDTO project;
    private List<WorkItemDTO> items;
}
