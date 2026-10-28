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

import java.util.ArrayList;
import java.util.List;

/** Hợp đồng thu (khách hàng trả) / chi (trả nhà cung cấp); money in VND. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_contract")
public class Contract extends BaseRecord {
    public static final String DRAFT = "Dự thảo";
    public static final String ACTIVE = "Đang thực hiện";
    public static final String LIQUIDATED = "Đã thanh lý";

    @Column(name = "contract_no", nullable = false, length = 100)
    private String contractNo;

    /** "thu" or "chi". */
    @Column(nullable = false, length = 8)
    private String kind;

    @Column(name = "project_id", length = 64)
    private String projectId;

    @Column(nullable = false)
    private String party;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private long value;

    @Column(name = "signed_date", length = 10)
    private String signedDate;

    @Column(name = "end_date", length = 10)
    private String endDate;

    @Column(nullable = false, length = 32)
    private String status;

    /** Set by Kế toán on the Công nợ table: the project behind the contract is finished. */
    @Column(name = "project_done", nullable = false)
    private boolean projectDone;

    /** Username and display name of the creator (may record an addendum). */
    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_by_name")
    private String createdByName;

    @ElementCollection
    @CollectionTable(name = "tbl_contract_installment", joinColumns = @JoinColumn(name = "contract_id"))
    @OrderColumn(name = "position")
    private List<ContractInstallment> installments = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "tbl_contract_payment", joinColumns = @JoinColumn(name = "contract_id"))
    @OrderColumn(name = "position")
    private List<ContractPayment> payments = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "tbl_contract_history", joinColumns = @JoinColumn(name = "contract_id"))
    @OrderColumn(name = "position")
    private List<ContractHistoryEntry> history = new ArrayList<>();
}
