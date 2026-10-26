package com.xxxx.ddd.application.vldc.news;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.xxxx.ddd.application.vldc.CollectionRow;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Same shape as NewsPost in erp-frontend.com/src/features/vldc/data/types.ts. */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NewsPostRow implements CollectionRow {
    @NotBlank
    private String id;

    @NotNull
    @Pattern(regexp = "Tin tức|Sự kiện|Thông báo nội bộ")
    private String kind;

    @NotBlank
    @Size(max = 500)
    private String title;

    @NotNull
    @Size(max = 1000)
    private String summary;

    @NotNull
    @Size(max = 60000)
    private String body;

    @NotBlank
    @Size(max = 32)
    private String audience;

    private boolean pinned;

    @NotNull
    @Pattern(regexp = "Nháp|Đã đăng|Đã gỡ")
    private String status;

    @NotBlank
    @Size(max = 64)
    private String authorRole;

    @NotNull
    @Size(max = 255)
    private String authorName;

    @Size(max = 40)
    private String publishedAt;

    @NotBlank
    @Size(max = 40)
    private String updatedAt;

    @Valid
    private NewsEventRow event;
}
