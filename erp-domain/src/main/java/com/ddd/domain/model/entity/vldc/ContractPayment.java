package com.xxxx.ddd.domain.model.entity.vldc;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** A receipt (hợp đồng thu) or payment (hợp đồng chi) actually made against one instalment. */
@Getter
@Setter
@Accessors(chain = true)
@Embeddable
public class ContractPayment {
    @Column(name = "payment_id", nullable = false, length = 64)
    private String paymentId;

    @Column(name = "installment_id", nullable = false, length = 64)
    private String installmentId;

    @Column(name = "pay_date", nullable = false, length = 10)
    private String payDate;

    @Column(nullable = false)
    private long amount;

    @Column(nullable = false, length = 32)
    private String method;

    @Column(length = 500)
    private String note;

    @Column(name = "recorded_by")
    private String recordedBy;

    @Column(name = "recorded_at", nullable = false, length = 40)
    private String recordedAt;
}
