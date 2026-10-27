package com.xxxx.ddd.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

/** Body lập / sửa nhiệm vụ (code bắt buộc khi lập, bỏ qua khi sửa). */
@Data
public class SaveMissionRequest {
    @Size(max = 30)
    private String code;
    @NotBlank
    @Size(max = 1000)
    private String title;
    /** Đơn vị / tổ đội; bỏ trống = đơn vị người lập. */
    private Long departmentId;
    private String projectCode;
    @NotNull
    private LocalDate dueDate;
    private List<Long> equipmentIds;
    private String content;
    private List<Long> followerUserIds;
}
