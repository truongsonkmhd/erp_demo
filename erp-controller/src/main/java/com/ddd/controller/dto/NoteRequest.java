package com.xxxx.ddd.controller.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/** Lý do / ghi chú kèm một quyết định (bắt buộc khi từ chối). */
@Data
public class NoteRequest {
    @Size(max = 1000)
    private String note;
}
