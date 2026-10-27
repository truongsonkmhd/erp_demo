package com.xxxx.ddd.domain.model.entity.vldc;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** One line of the contract Lịch sử: who changed what, and when. */
@Getter
@Setter
@Accessors(chain = true)
@Embeddable
public class ContractHistoryEntry {
    @Column(nullable = false, length = 40)
    private String at;

    @Column(name = "by_name", nullable = false)
    private String byName;

    @Column(nullable = false, length = 64)
    private String action;

    @Column(length = 1000)
    private String detail;
}
