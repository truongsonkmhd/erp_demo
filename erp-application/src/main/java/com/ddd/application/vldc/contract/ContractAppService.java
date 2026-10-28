package com.xxxx.ddd.application.vldc.contract;

import com.xxxx.ddd.application.exception.NotFoundException;
import com.xxxx.ddd.application.service.security.CurrentActor;
import com.xxxx.ddd.application.vldc.CollectionChangedEvent;
import com.xxxx.ddd.domain.model.entity.Role;
import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.model.entity.vldc.CashEntry;
import com.xxxx.ddd.domain.model.entity.vldc.Contract;
import com.xxxx.ddd.domain.model.entity.vldc.ContractHistoryEntry;
import com.xxxx.ddd.domain.model.entity.vldc.ContractInstallment;
import com.xxxx.ddd.domain.model.entity.vldc.ContractPayment;
import com.xxxx.ddd.domain.respository.vldc.CashEntryRepository;
import com.xxxx.ddd.domain.respository.vldc.ContractRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Hợp đồng, lịch thanh toán, thu / chi. Workflow agreed with the business:
 * Chuyên viên KH-TC (or Kế toán, for small internal contracts) creates the contract (Dự thảo);
 * Kế toán sets the instalments – their total must equal the contract value – and confirms them (Đang thực hiện);
 * every receipt / payment is recorded against an instalment and a fully paid instalment is locked;
 * the value only changes through an addendum (phụ lục) by the creator; Kế toán liquidates a fully paid contract.
 * Kế toán trưởng follows every change in the history; Liên đoàn trưởng only reads. Every change is logged and announced
 * on /topic/vldc/contracts.
 */
@Service
public class ContractAppService {
    public static final String COLLECTION = "contracts";
    static final Set<String> CREATORS = Set.of("kehoach", "ketoan", "ketoantruong");
    static final Set<String> ACCOUNTANTS = Set.of("ketoan", "ketoantruong");
    static final Set<String> READERS = Set.of("kehoach", "ketoan", "ketoantruong", "lanhdao");
    static final Set<String> METHODS = Set.of("Chuyển khoản", "Tiền mặt");

    private final ContractRepository contracts;
    private final CashEntryRepository cash;
    private final CurrentActor actor;
    private final ApplicationEventPublisher events;

    public ContractAppService(ContractRepository contracts, CashEntryRepository cash, CurrentActor actor, ApplicationEventPublisher events) {
        this.contracts = contracts;
        this.cash = cash;
        this.actor = actor;
        this.events = events;
    }

    /** The signed-in user, reloaded from the database. */
    record Caller(String username, String name, Set<String> roles, boolean admin) {
        boolean any(Set<String> allowed) { return admin || roles.stream().anyMatch(allowed::contains); }
        boolean reads() { return any(READERS); }
        boolean creates() { return any(CREATORS); }
        boolean accountant() { return any(ACCOUNTANTS); }
        boolean chiefAccountant() { return admin || roles.contains("ketoantruong"); }
    }

    private Caller caller() {
        User user = actor.require();
        Set<String> roles = user.getRoles().stream().map(Role::getCode).collect(Collectors.toSet());
        String name = user.getFullName() == null || user.getFullName().isBlank() ? user.getUsername() : user.getFullName();
        return new Caller(user.getUsername(), name, roles, user.getRoles().stream().anyMatch(Role::isAdmin));
    }

    // ---------- Read

    @Transactional(readOnly = true)
    public ContractRows.Ledger ledger() {
        Caller c = caller();
        if (!c.reads()) throw new AccessDeniedException("Không có quyền xem hợp đồng và thu chi");
        String today = today();
        List<Contract> all = contracts.findAll();
        List<ContractRows.Contract> rows = all.stream()
                .sorted(Comparator.comparing(Contract::getContractNo))
                .map(x -> toRow(x, c, today)).toList();
        List<CashEntry> entries = cash.findAll();
        List<ContractRows.CashEntry> cashRows = entries.stream()
                .sorted(Comparator.comparing(CashEntry::getEntryDate).reversed())
                .map(e -> new ContractRows.CashEntry(e.getId(), e.getKind(), e.getEntryDate(), e.getAmount(), e.getContent(),
                        e.getCounterparty(), e.getMethod(), e.getProjectId(), e.getCreatedByName(), c.accountant()))
                .toList();
        return new ContractRows.Ledger(rows, cashRows, summary(rows, entries, today), c.creates(), c.accountant());
    }

    private ContractRows.Summary summary(List<ContractRows.Contract> rows, List<CashEntry> entries, String today) {
        String month = today.substring(0, 7);
        List<ContractRows.Contract> live = rows.stream().filter(r -> !Contract.DRAFT.equals(r.status())).toList();
        List<ContractRows.Contract> thuC = live.stream().filter(r -> "thu".equals(r.kind())).toList();
        List<ContractRows.Contract> chiC = live.stream().filter(r -> "chi".equals(r.kind())).toList();
        long thuContract = thuC.stream().mapToLong(ContractRows.Contract::paid).sum();
        long chiContract = chiC.stream().mapToLong(ContractRows.Contract::paid).sum();
        long thuOther = entries.stream().filter(e -> "thu".equals(e.getKind())).mapToLong(CashEntry::getAmount).sum();
        long chiOther = entries.stream().filter(e -> "chi".equals(e.getKind())).mapToLong(CashEntry::getAmount).sum();
        long thuMonth = sumPaymentsInMonth(thuC, month) + entries.stream().filter(e -> "thu".equals(e.getKind()) && e.getEntryDate().startsWith(month)).mapToLong(CashEntry::getAmount).sum();
        long chiMonth = sumPaymentsInMonth(chiC, month) + entries.stream().filter(e -> "chi".equals(e.getKind()) && e.getEntryDate().startsWith(month)).mapToLong(CashEntry::getAmount).sum();
        long contractRevenue = thuC.stream().mapToLong(ContractRows.Contract::value).sum();
        return new ContractRows.Summary(
                contractRevenue + thuOther, contractRevenue, thuContract + thuOther, thuContract, thuOther,
                chiContract + chiOther, chiContract, chiOther, thuMonth, chiMonth,
                thuC.stream().mapToLong(ContractRows.Contract::remaining).sum(),
                chiC.stream().mapToLong(ContractRows.Contract::remaining).sum(),
                thuC.stream().mapToLong(ContractRows.Contract::overdue).sum(),
                chiC.stream().mapToLong(ContractRows.Contract::overdue).sum(),
                (int) thuC.stream().filter(r -> r.remaining() > 0).count(),
                (int) thuC.stream().filter(r -> r.projectDone() && r.remaining() > 0).count());
    }

    private static long sumPaymentsInMonth(List<ContractRows.Contract> rows, String month) {
        return rows.stream().flatMap(r -> r.payments().stream()).filter(p -> p.date().startsWith(month)).mapToLong(ContractRows.Payment::amount).sum();
    }

    private ContractRows.Contract toRow(Contract x, Caller c, String today) {
        Map<String, Long> paidBy = paidByInstallment(x);
        List<ContractRows.Installment> installments = x.getInstallments().stream().map(i -> {
            long paid = paidBy.getOrDefault(i.getInstallmentId(), 0L);
            long remaining = Math.max(0, i.getAmount() - paid);
            boolean overdue = remaining > 0 && i.getDueDate() != null && i.getDueDate().compareTo(today) < 0 && !Contract.DRAFT.equals(x.getStatus());
            return new ContractRows.Installment(i.getInstallmentId(), i.getName(), i.getAmount(), i.getDueDate(), i.getConditionText(),
                    paid, remaining, paid >= i.getAmount() && i.getAmount() > 0, overdue);
        }).toList();
        Map<String, String> names = x.getInstallments().stream().collect(Collectors.toMap(ContractInstallment::getInstallmentId, ContractInstallment::getName, (a, b) -> a));
        List<ContractRows.Payment> payments = x.getPayments().stream()
                .map(p -> new ContractRows.Payment(p.getPaymentId(), p.getInstallmentId(), names.getOrDefault(p.getInstallmentId(), "–"),
                        p.getPayDate(), p.getAmount(), p.getMethod(), p.getNote(), p.getRecordedBy(), p.getRecordedAt()))
                .toList();
        List<ContractRows.History> history = x.getHistory().stream()
                .map(h -> new ContractRows.History(h.getAt(), h.getByName(), h.getAction(), h.getDetail())).toList();
        long paid = x.getPayments().stream().mapToLong(ContractPayment::getAmount).sum();
        long scheduleTotal = x.getInstallments().stream().mapToLong(ContractInstallment::getAmount).sum();
        ContractRows.Installment next = installments.stream().filter(i -> i.remaining() > 0).findFirst().orElse(null);
        boolean draft = Contract.DRAFT.equals(x.getStatus()), active = Contract.ACTIVE.equals(x.getStatus());
        boolean creator = c.admin() || Objects.equals(x.getCreatedBy(), c.username()) || c.roles().contains("kehoach");
        ContractRows.Permissions can = new ContractRows.Permissions(
                !Contract.LIQUIDATED.equals(x.getStatus()) && (draft ? c.creates() : creator),
                active && creator,
                !Contract.LIQUIDATED.equals(x.getStatus()) && c.accountant(),
                draft && c.accountant(),
                active && c.accountant(),
                active && c.chiefAccountant(),
                active && c.accountant() && paid >= x.getValue() && scheduleTotal == x.getValue(),
                draft && (c.admin() || Objects.equals(x.getCreatedBy(), c.username())));
        return new ContractRows.Contract(x.getId(), x.getContractNo(), x.getKind(), x.getProjectId(), x.getParty(), x.getContent(),
                x.getValue(), x.getSignedDate(), x.getEndDate(), x.getStatus(), x.isProjectDone(), x.getCreatedByName(),
                paid, Math.max(0, x.getValue() - paid), scheduleTotal, scheduleTotal == x.getValue(),
                installments.stream().filter(ContractRows.Installment::overdue).mapToLong(ContractRows.Installment::remaining).sum(),
                next == null ? null : next.dueDate(), next == null ? null : next.name(), installments, payments, history, can);
    }

    private static Map<String, Long> paidByInstallment(Contract x) {
        Map<String, Long> paid = new HashMap<>();
        x.getPayments().forEach(p -> paid.merge(p.getInstallmentId(), p.getAmount(), Long::sum));
        return paid;
    }

    // ---------- Contract

    @Transactional
    public String create(ContractRows.ContractInput in) {
        Caller c = caller();
        if (!c.creates()) throw new AccessDeniedException("Chỉ Chuyên viên KH-TC và Kế toán được tạo hợp đồng");
        String contractNo = requireText(in.contractNo(), "Số hợp đồng", 100);
        requireFreeNo(contractNo, null);
        Contract x = new Contract().setContractNo(contractNo).setKind(kind(in.kind())).setProjectId(requireText(in.projectId(), "Dự án", 64))
                .setParty(requireText(in.party(), "Đối tác", 255)).setContent(optional(in.content(), 20000)).setValue(positive(in.value(), "Giá trị hợp đồng"))
                .setSignedDate(date(in.signedDate(), false)).setEndDate(date(in.endDate(), false)).setStatus(Contract.DRAFT)
                .setCreatedBy(c.username()).setCreatedByName(c.name());
        x.setId(newId("HD"));
        log(x, c, "Tạo hợp đồng", "Hợp đồng " + x.getKind() + " " + contractNo + " – giá trị " + money(x.getValue()));
        contracts.save(x);
        changed(x.getId());
        return x.getId();
    }

    /** Contract details; the value can only change here while the contract is a draft (afterwards: addendum). */
    @Transactional
    public void updateInfo(String id, ContractRows.ContractInput in) {
        Caller c = caller();
        Contract x = contract(id);
        ContractRows.Permissions can = toRow(x, c, today()).can();
        if (!can.editInfo()) throw new AccessDeniedException("Không được sửa thông tin hợp đồng này");
        String contractNo = requireText(in.contractNo(), "Số hợp đồng", 100);
        requireFreeNo(contractNo, id);
        List<String> changes = new ArrayList<>();
        if (!contractNo.equals(x.getContractNo())) changes.add("số " + x.getContractNo() + " → " + contractNo);
        x.setContractNo(contractNo).setProjectId(requireText(in.projectId(), "Dự án", 64)).setParty(requireText(in.party(), "Đối tác", 255))
                .setContent(optional(in.content(), 20000)).setSignedDate(date(in.signedDate(), false)).setEndDate(date(in.endDate(), false));
        if (Contract.DRAFT.equals(x.getStatus())) {
            x.setKind(kind(in.kind()));
            long value = positive(in.value(), "Giá trị hợp đồng");
            if (value != x.getValue()) changes.add("giá trị " + money(x.getValue()) + " → " + money(value));
            x.setValue(value);
        } else if (in.value() != null && in.value() != x.getValue()) {
            throw new IllegalArgumentException("Hợp đồng đang thực hiện: thay đổi giá trị phải qua phụ lục");
        }
        log(x, c, "Sửa thông tin", changes.isEmpty() ? "Cập nhật thông tin chung" : String.join("; ", changes));
        contracts.save(x);
        changed(id);
    }

    /** Phụ lục: the creator changes the value of a running contract; Kế toán then adjusts the unpaid instalments. */
    @Transactional
    public void addendum(String id, ContractRows.AddendumInput in) {
        Caller c = caller();
        Contract x = contract(id);
        if (!toRow(x, c, today()).can().addendum()) throw new AccessDeniedException("Chỉ người tạo hợp đồng nhập phụ lục");
        long value = positive(in.value(), "Giá trị mới");
        long paid = x.getPayments().stream().mapToLong(ContractPayment::getAmount).sum();
        if (value < paid) throw new IllegalArgumentException("Giá trị mới nhỏ hơn số đã thanh toán (" + money(paid) + ")");
        String note = requireText(in.note(), "Nội dung phụ lục", 500);
        log(x, c, "Phụ lục", "Giá trị " + money(x.getValue()) + " → " + money(value) + ". " + note);
        contracts.save(x.setValue(value));
        changed(id);
    }

    /**
     * Kế toán sets the instalments. Fully paid ones are locked; a partly paid one keeps at least its paid amount; an
     * instalment with payments cannot be removed. A running contract must stay balanced (total = value).
     */
    @Transactional
    public void setSchedule(String id, ContractRows.ScheduleInput in) {
        Caller c = caller();
        Contract x = contract(id);
        if (!toRow(x, c, today()).can().editSchedule()) throw new AccessDeniedException("Chỉ Kế toán lập lịch thanh toán");
        List<ContractRows.InstallmentInput> items = in.installments() == null ? List.of() : in.installments();
        if (items.isEmpty()) throw new IllegalArgumentException("Lịch thanh toán cần ít nhất một đợt");
        if (items.size() > 50) throw new IllegalArgumentException("Tối đa 50 đợt");
        Map<String, ContractInstallment> old = x.getInstallments().stream().collect(Collectors.toMap(ContractInstallment::getInstallmentId, i -> i));
        Map<String, Long> paid = paidByInstallment(x);
        List<ContractInstallment> next = new ArrayList<>();
        Set<String> kept = new HashSet<>();
        for (ContractRows.InstallmentInput i : items) {
            String iid = i.id() != null && old.containsKey(i.id()) ? i.id() : newId("DOT");
            if (!kept.add(iid)) throw new IllegalArgumentException("Đợt bị lặp");
            long amount = positive(i.amount(), "Số tiền đợt");
            long alreadyPaid = paid.getOrDefault(iid, 0L);
            ContractInstallment prev = old.get(iid);
            ContractInstallment item = new ContractInstallment().setInstallmentId(iid).setName(requireText(i.name(), "Tên đợt", 255))
                    .setAmount(amount).setDueDate(date(i.dueDate(), false)).setConditionText(optional(i.condition(), 500));
            if (prev != null && alreadyPaid >= prev.getAmount() && prev.getAmount() > 0
                    && (amount != prev.getAmount() || !Objects.equals(item.getDueDate(), prev.getDueDate()))) {
                throw new IllegalArgumentException("Đợt \"" + prev.getName() + "\" đã thanh toán đủ, không sửa số tiền / hạn được");
            }
            if (amount < alreadyPaid) throw new IllegalArgumentException("Đợt \"" + item.getName() + "\" đã thu/chi " + money(alreadyPaid) + ", không thể nhỏ hơn");
            next.add(item);
        }
        for (String removed : old.keySet()) {
            if (!kept.contains(removed) && paid.getOrDefault(removed, 0L) > 0) {
                throw new IllegalArgumentException("Đợt \"" + old.get(removed).getName() + "\" đã có thanh toán, không xóa được");
            }
        }
        long total = next.stream().mapToLong(ContractInstallment::getAmount).sum();
        if (Contract.ACTIVE.equals(x.getStatus()) && total != x.getValue()) {
            throw new IllegalArgumentException("Tổng các đợt (" + money(total) + ") phải bằng giá trị hợp đồng (" + money(x.getValue()) + ")");
        }
        String detail = next.stream().map(i -> i.getName() + " " + money(i.getAmount()) + (i.getDueDate() == null ? "" : " hạn " + i.getDueDate()))
                .collect(Collectors.joining("; "));
        x.getInstallments().clear();
        x.getInstallments().addAll(next);
        log(x, c, "Lập lịch thanh toán", detail);
        contracts.save(x);
        changed(id);
    }

    /** Dự thảo → Đang thực hiện once the schedule is balanced. */
    @Transactional
    public void confirm(String id) {
        Caller c = caller();
        Contract x = contract(id);
        if (!toRow(x, c, today()).can().confirm()) throw new AccessDeniedException("Chỉ Kế toán xác nhận lịch thanh toán của hợp đồng dự thảo");
        long total = x.getInstallments().stream().mapToLong(ContractInstallment::getAmount).sum();
        if (x.getInstallments().isEmpty()) throw new IllegalArgumentException("Chưa có đợt thanh toán nào");
        if (total != x.getValue()) throw new IllegalArgumentException("Tổng các đợt (" + money(total) + ") phải bằng giá trị hợp đồng (" + money(x.getValue()) + ")");
        x.setStatus(Contract.ACTIVE);
        log(x, c, "Xác nhận lịch thanh toán", x.getInstallments().size() + " đợt, tổng " + money(total));
        contracts.save(x);
        changed(id);
    }

    @Transactional
    public void recordPayment(String id, ContractRows.PaymentInput in) {
        Caller c = caller();
        Contract x = contract(id);
        if (!toRow(x, c, today()).can().record()) throw new AccessDeniedException("Chỉ Kế toán ghi nhận thu / chi của hợp đồng đang thực hiện");
        ContractInstallment inst = x.getInstallments().stream().filter(i -> i.getInstallmentId().equals(in.installmentId())).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đợt thanh toán"));
        long remaining = inst.getAmount() - paidByInstallment(x).getOrDefault(inst.getInstallmentId(), 0L);
        long amount = positive(in.amount(), "Số tiền");
        if (remaining <= 0) throw new IllegalArgumentException("Đợt \"" + inst.getName() + "\" đã thanh toán đủ");
        if (amount > remaining) throw new IllegalArgumentException("Số tiền vượt phần còn lại của đợt (" + money(remaining) + ")");
        String method = in.method() == null ? "Chuyển khoản" : in.method();
        if (!METHODS.contains(method)) throw new IllegalArgumentException("Hình thức không hợp lệ");
        x.getPayments().add(new ContractPayment().setPaymentId(newId("TT")).setInstallmentId(inst.getInstallmentId())
                .setPayDate(date(in.date(), true)).setAmount(amount).setMethod(method).setNote(optional(in.note(), 500))
                .setRecordedBy(c.name()).setRecordedAt(now()));
        log(x, c, "thu".equals(x.getKind()) ? "Ghi nhận thu" : "Ghi nhận chi", inst.getName() + ": " + money(amount) + " ngày " + in.date());
        contracts.save(x);
        changed(id);
    }

    /** Correction by Kế toán trưởng: removes a wrongly recorded payment (kept in the history). */
    @Transactional
    public void deletePayment(String id, String paymentId) {
        Caller c = caller();
        Contract x = contract(id);
        if (!toRow(x, c, today()).can().deletePayment()) throw new AccessDeniedException("Chỉ Kế toán trưởng hủy được một lần thu / chi");
        ContractPayment p = x.getPayments().stream().filter(y -> y.getPaymentId().equals(paymentId)).findFirst()
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lần thanh toán"));
        x.getPayments().remove(p);
        log(x, c, "Hủy lần thanh toán", money(p.getAmount()) + " ngày " + p.getPayDate());
        contracts.save(x);
        changed(id);
    }

    @Transactional
    public void liquidate(String id) {
        Caller c = caller();
        Contract x = contract(id);
        if (!toRow(x, c, today()).can().liquidate()) throw new IllegalArgumentException("Chỉ thanh lý được hợp đồng đã thanh toán đủ");
        x.setStatus(Contract.LIQUIDATED);
        log(x, c, "Thanh lý", "Đã thanh toán đủ " + money(x.getValue()));
        contracts.save(x);
        changed(id);
    }

    @Transactional
    public void setProjectDone(String id, boolean done) {
        Caller c = caller();
        Contract x = contract(id);
        if (!c.accountant()) throw new AccessDeniedException("Chỉ Kế toán cập nhật trạng thái dự án trên công nợ");
        x.setProjectDone(done);
        log(x, c, "Trạng thái dự án", done ? "Đã hoàn thành" : "Đang thực hiện");
        contracts.save(x);
        changed(id);
    }

    @Transactional
    public void delete(String id) {
        Caller c = caller();
        Contract x = contract(id);
        if (!toRow(x, c, today()).can().delete()) throw new AccessDeniedException("Chỉ xóa được hợp đồng dự thảo do chính mình tạo");
        contracts.delete(x);
        changed(id);
    }

    // ---------- Thu khác / chi khác

    @Transactional
    public String saveCash(String id, ContractRows.CashInput in) {
        Caller c = caller();
        if (!c.accountant()) throw new AccessDeniedException("Chỉ Kế toán lập phiếu thu / chi");
        CashEntry e = id == null ? new CashEntry() : cash.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu"));
        if (id == null) {
            String k = kind(in.kind());
            e.setId(newId("thu".equals(k) ? "PT" : "PC"));
            e.setKind(k).setCreatedBy(c.username()).setCreatedByName(c.name());
        }
        String method = in.method() == null ? "Chuyển khoản" : in.method();
        if (!METHODS.contains(method)) throw new IllegalArgumentException("Hình thức không hợp lệ");
        e.setEntryDate(date(in.date(), true)).setAmount(positive(in.amount(), "Số tiền")).setContent(requireText(in.content(), "Nội dung", 500))
                .setCounterparty(optional(in.counterparty(), 255)).setMethod(method).setProjectId(optional(in.projectId(), 64));
        e.setUpdatedBy(c.username());
        cash.save(e);
        changed(e.getId());
        return e.getId();
    }

    @Transactional
    public void deleteCash(String id) {
        Caller c = caller();
        if (!c.accountant()) throw new AccessDeniedException("Chỉ Kế toán xóa phiếu thu / chi");
        cash.delete(cash.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu")));
        changed(id);
    }

    // ---------- Helpers

    private Contract contract(String id) {
        return contracts.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy hợp đồng"));
    }

    private void requireFreeNo(String contractNo, String exceptId) {
        boolean clash = contracts.findAll().stream().anyMatch(x -> !x.getId().equals(exceptId) && x.getContractNo().equalsIgnoreCase(contractNo));
        if (clash) throw new IllegalArgumentException("Số hợp đồng đã tồn tại: " + contractNo);
    }

    private static void log(Contract x, Caller c, String action, String detail) {
        String d = detail == null ? null : detail.length() > 1000 ? detail.substring(0, 997) + "…" : detail;
        x.getHistory().add(new ContractHistoryEntry().setAt(now()).setByName(c.name()).setAction(action).setDetail(d));
        x.setUpdatedBy(c.username());
    }

    private void changed(String id) {
        events.publishEvent(new CollectionChangedEvent(COLLECTION, List.of(id), false));
    }

    private static String kind(String raw) {
        if (!"thu".equals(raw) && !"chi".equals(raw)) throw new IllegalArgumentException("Loại hợp đồng phải là thu hoặc chi");
        return raw;
    }

    private static String requireText(String raw, String label, int max) {
        String v = raw == null ? "" : raw.trim();
        if (v.isEmpty()) throw new IllegalArgumentException("Vui lòng nhập " + label.toLowerCase(Locale.ROOT));
        if (v.length() > max) throw new IllegalArgumentException(label + " tối đa " + max + " ký tự");
        return v;
    }

    private static String optional(String raw, int max) {
        String v = raw == null ? "" : raw.trim();
        if (v.length() > max) throw new IllegalArgumentException("Nội dung quá dài (tối đa " + max + " ký tự)");
        return v.isEmpty() ? (max >= 20000 ? "" : null) : v;
    }

    private static long positive(Long value, String label) {
        if (value == null || value <= 0) throw new IllegalArgumentException(label + " phải lớn hơn 0");
        if (value > 1_000_000_000_000_000L) throw new IllegalArgumentException(label + " quá lớn");
        return value;
    }

    private static String date(String raw, boolean required) {
        if (raw == null || raw.isBlank()) {
            if (required) throw new IllegalArgumentException("Vui lòng chọn ngày");
            return null;
        }
        try {
            return LocalDate.parse(raw.trim()).toString();
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("Ngày không hợp lệ: " + raw);
        }
    }

    static String money(long v) {
        return NumberFormat.getInstance(Locale.forLanguageTag("vi-VN")).format(v) + " đ";
    }

    private static String newId(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
    }

    private static String today() {
        return LocalDate.now().toString();
    }

    private static String now() {
        return LocalDateTime.now().withNano(0).toString();
    }
}
