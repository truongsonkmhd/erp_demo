package com.xxxx.ddd.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Body ghi chú. */
@Data
public class CommentRequest {
    @NotBlank
    @Size(max = 5000)
    private String content;
}
