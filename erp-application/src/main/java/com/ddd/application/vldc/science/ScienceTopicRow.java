package com.xxxx.ddd.application.vldc.science;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.xxxx.ddd.application.vldc.CollectionRow;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/** Same shape as ScienceTopic in erp-frontend.com/src/features/vldc/data/types.ts. */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScienceTopicRow implements CollectionRow {
    public static final String ACCEPTED = "Đã triển khai";

    @NotBlank
    private String id;

    @NotBlank
    @Size(max = 500)
    private String title;

    @NotBlank
    @Size(max = 64)
    private String field;

    @NotBlank
    @Size(max = 16)
    private String unit;

    @Size(max = 64)
    private String subUnit;

    @NotNull
    @Size(max = 20000)
    private String objective;

    @NotBlank
    @Size(max = 64)
    private String leadRole;

    @NotNull
    @Size(max = 255)
    private String leadName;

    @NotNull
    private List<@NotBlank @Size(max = 64) String> members = new ArrayList<>();

    @NotBlank
    @Size(max = 10)
    private String start;

    @NotBlank
    @Size(max = 10)
    private String end;

    private double budget;

    private double spent;

    @NotNull
    private List<@NotBlank @Size(max = 255) String> attachments = new ArrayList<>();

    @Min(0)
    @Max(100)
    private int progress;

    @NotNull
    @Valid
    private List<LogRow> log = new ArrayList<>();

    @NotNull
    @Pattern(regexp = "Đang triển khai|Chờ duyệt|Đã triển khai")
    private String status;

    @Size(max = 20000)
    private String result;

    @Size(max = 20000)
    private String impact;

    @Size(max = 40)
    private String submittedAt;

    @Size(max = 40)
    private String approvedAt;

    @Valid
    private ReviewRow review;

    @NotBlank
    @Size(max = 40)
    private String createdAt;

    /** TopicProgressLog. */
    @Data
    public static class LogRow {
        @NotBlank
        @Size(max = 40)
        private String at;

        @NotBlank
        @Size(max = 64)
        private String by;

        @NotNull
        @Size(max = 255)
        private String byName;

        @Min(0)
        @Max(100)
        private int progress;

        @NotNull
        @Size(max = 20000)
        private String note;
    }

    /** The Liên đoàn trưởng's acceptance decision. */
    @Data
    public static class ReviewRow {
        @NotBlank
        @Size(max = 64)
        private String by;

        @NotBlank
        @Size(max = 40)
        private String at;

        @NotNull
        @Pattern(regexp = "Duyệt|Trả lại")
        private String decision;

        @NotNull
        @Size(max = 20000)
        private String note;
    }
}
