package com.xxxx.ddd.domain.model.entity.vldc;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** Thu khác / chi khác: money in or out that belongs to no contract; money in VND. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_cash_entry")
public class CashEntry extends BaseRecord {
    /** "thu" or "chi". */
    @Column(nullable = false, length = 8)
    private String kind;

    @Column(name = "entry_date", nullable = false, length = 10)
    private String entryDate;

    @Column(nullable = false)
    private long amount;

    @Column(nullable = false, length = 500)
    private String content;

    private String counterparty;

    @Column(nullable = false, length = 32)
    private String method;

    @Column(name = "project_id", length = 64)
    private String projectId;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_by_name")
    private String createdByName;
}
