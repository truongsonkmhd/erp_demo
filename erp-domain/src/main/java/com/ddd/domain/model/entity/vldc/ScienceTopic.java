package com.xxxx.ddd.domain.model.entity.vldc;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;

/** Đề tài KH-CN & Đổi mới (collection "science_topics"). Dates stay the strings the frontend sends. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_science_topic")
public class ScienceTopic extends BaseRecord {
    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, length = 64)
    private String field;

    /** UnitCode (BLD, KT, KHTC, MD…), the scope the topic is visible in. */
    @Column(nullable = false, length = 16)
    private String unit;

    @Column(name = "sub_unit", length = 64)
    private String subUnit;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String objective;

    @Column(name = "lead_role", nullable = false, length = 64)
    private String leadRole;

    @Column(name = "lead_name", nullable = false)
    private String leadName;

    /** Role codes of the members. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "JSON")
    private List<String> members = new ArrayList<>();

    @Column(name = "start_date", nullable = false, length = 10)
    private String startDate;

    @Column(name = "end_date", nullable = false, length = 10)
    private String endDate;

    /** Million VND. */
    @Column(nullable = false)
    private double budget;

    @Column(nullable = false)
    private double spent;

    /** File names. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "JSON")
    private List<String> attachments = new ArrayList<>();

    @Column(nullable = false)
    private int progress;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String result;

    @Column(columnDefinition = "TEXT")
    private String impact;

    @Column(name = "submitted_at", length = 40)
    private String submittedAt;

    @Column(name = "approved_at", length = 40)
    private String approvedAt;

    @Column(name = "review_by", length = 64)
    private String reviewBy;

    @Column(name = "review_at", length = 40)
    private String reviewAt;

    @Column(name = "review_decision", length = 16)
    private String reviewDecision;

    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;

    /** ScienceTopic.createdAt of the frontend (not the audit column). */
    @Column(name = "topic_created_at", nullable = false, length = 40)
    private String topicCreatedAt;

    @ElementCollection
    @CollectionTable(name = "tbl_science_topic_log", joinColumns = @JoinColumn(name = "science_topic_id"))
    @OrderColumn(name = "position")
    private List<ScienceTopicLog> log = new ArrayList<>();
}
