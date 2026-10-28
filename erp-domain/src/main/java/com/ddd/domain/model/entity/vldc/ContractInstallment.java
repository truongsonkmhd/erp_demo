package com.xxxx.ddd.domain.model.entity.vldc;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** One đợt of the payment schedule; installmentId stays stable so payments can point to it. */
@Getter
@Setter
@Accessors(chain = true)
@Embeddable
public class ContractInstallment {
    @Column(name = "installment_id", nullable = false, length = 64)
    private String installmentId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private long amount;

    @Column(name = "due_date", length = 10)
    private String dueDate;

    @Column(name = "condition_text", length = 500)
    private String conditionText;
}
