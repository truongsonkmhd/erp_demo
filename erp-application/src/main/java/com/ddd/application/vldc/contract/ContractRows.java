package com.xxxx.ddd.application.vldc.contract;

import java.util.List;

/** JSON shapes of /api/vldc/contracts and /api/vldc/cash-entries (same as ledgerStore.ts). Money in VND. */
public final class ContractRows {
    private ContractRows() { }

    /** paid / remaining are computed from the payments; locked = fully paid (no longer editable). */
    public record Installment(String id, String name, long amount, String dueDate, String condition, long paid, long remaining,
                              boolean locked, boolean overdue) { }

    public record Payment(String id, String installmentId, String installmentName, String date, long amount, String method,
                          String note, String recordedBy, String recordedAt) { }

    public record History(String at, String by, String action, String detail) { }

    /** What the signed-in user may do on this contract (the backend checks again on every call). */
    public record Permissions(boolean editInfo, boolean addendum, boolean editSchedule, boolean confirm, boolean record,
                              boolean deletePayment, boolean liquidate, boolean delete) { }

    public record Contract(String id, String contractNo, String kind, String projectId, String party, String content, long value,
                           String signedDate, String endDate, String status, boolean projectDone, String createdByName,
                           long paid, long remaining, long scheduleTotal, boolean scheduleMatches, long overdue,
                           String nextDueDate, String nextDueName, List<Installment> installments, List<Payment> payments,
                           List<History> history, Permissions can) { }

    public record CashEntry(String id, String kind, String date, long amount, String content, String counterparty, String method,
                            String projectId, String createdByName, boolean canEdit) { }

    /** Figures for the leader dashboard and the Thu / Chi / Công nợ pages (contracts in Dự thảo are left out). */
    public record Summary(long revenue, long contractRevenue, long thu, long thuContract, long thuOther, long chi, long chiContract,
                          long chiOther, long thuMonth, long chiMonth, long receivable, long payable, long overdueReceivable,
                          long overduePayable, int receivableContracts, int doneOwing) { }

    public record Ledger(List<Contract> contracts, List<CashEntry> cashEntries, Summary summary, boolean canCreate,
                         boolean canManageMoney) { }

    // ---------- Inputs

    public record ContractInput(String contractNo, String kind, String projectId, String party, String content, Long value,
                                String signedDate, String endDate) { }

    public record InstallmentInput(String id, String name, Long amount, String dueDate, String condition) { }

    public record ScheduleInput(List<InstallmentInput> installments) { }

    public record PaymentInput(String installmentId, String date, Long amount, String method, String note) { }

    public record AddendumInput(Long value, String note) { }

    public record ProjectDoneInput(boolean done) { }

    public record CashInput(String kind, String date, Long amount, String content, String counterparty, String method, String projectId) { }
}
