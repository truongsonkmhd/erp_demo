package com.xxxx.ddd.application.model.work;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Trang dự án: thông tin dòng danh sách cộng thông tin chung, phê duyệt, đề nghị xoá và quyền của người xem. */
@Data
@EqualsAndHashCode(callSuper = true)
public class ProjectDetailDTO extends ProjectSummaryDTO {
    private String description;
    private PersonRefDTO manager;
    private List<DepartmentRefDTO> coDepartments;
    /** Ngân sách dự kiến (đồng). */
    private BigDecimal estimatedBudget;
    private LocalDate startDate;
    /** Lý do Liên đoàn trưởng không duyệt. */
    private String approvalNote;
    private LocalDateTime approvedAt;
    private PersonRefDTO createdBy;
    private ProjectDeleteRequestDTO deleteRequest;
    /** Lý do không xoá của lần đề nghị xoá gần nhất (nếu lần đó bị từ chối). */
    private String lastDeleteRefusal;
    private ProjectPermissionsDTO permissions;
}
