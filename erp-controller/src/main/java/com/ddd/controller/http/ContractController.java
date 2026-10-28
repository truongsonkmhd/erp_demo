package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.vldc.contract.ContractAppService;
import com.xxxx.ddd.application.vldc.contract.ContractRows;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import org.springframework.web.bind.annotation.*;

/**
 * Hợp đồng, lịch thanh toán, thu / chi (authenticated like all of /api/vldc/**; roles and rules in ContractAppService).
 * GET returns every contract with computed figures, the thu khác / chi khác entries and the dashboard summary.
 */
@RestController
@RequestMapping("/api/vldc")
public class ContractController {
    private final ContractAppService contracts;

    public ContractController(ContractAppService contracts) {
        this.contracts = contracts;
    }

    @GetMapping("/contracts")
    public ResultMessage<ContractRows.Ledger> ledger() {
        return ResultUtil.data(contracts.ledger());
    }

    @PostMapping("/contracts")
    public ResultMessage<String> create(@RequestBody ContractRows.ContractInput body) {
        return ResultUtil.data(contracts.create(body));
    }

    @PutMapping("/contracts/{id}")
    public ResultMessage<Void> updateInfo(@PathVariable String id, @RequestBody ContractRows.ContractInput body) {
        contracts.updateInfo(id, body);
        return ResultUtil.data(null);
    }

    @DeleteMapping("/contracts/{id}")
    public ResultMessage<Void> delete(@PathVariable String id) {
        contracts.delete(id);
        return ResultUtil.data(null);
    }

    @PostMapping("/contracts/{id}/addendum")
    public ResultMessage<Void> addendum(@PathVariable String id, @RequestBody ContractRows.AddendumInput body) {
        contracts.addendum(id, body);
        return ResultUtil.data(null);
    }

    @PutMapping("/contracts/{id}/schedule")
    public ResultMessage<Void> schedule(@PathVariable String id, @RequestBody ContractRows.ScheduleInput body) {
        contracts.setSchedule(id, body);
        return ResultUtil.data(null);
    }

    @PostMapping("/contracts/{id}/confirm")
    public ResultMessage<Void> confirm(@PathVariable String id) {
        contracts.confirm(id);
        return ResultUtil.data(null);
    }

    @PostMapping("/contracts/{id}/payments")
    public ResultMessage<Void> recordPayment(@PathVariable String id, @RequestBody ContractRows.PaymentInput body) {
        contracts.recordPayment(id, body);
        return ResultUtil.data(null);
    }

    @DeleteMapping("/contracts/{id}/payments/{paymentId}")
    public ResultMessage<Void> deletePayment(@PathVariable String id, @PathVariable String paymentId) {
        contracts.deletePayment(id, paymentId);
        return ResultUtil.data(null);
    }

    @PostMapping("/contracts/{id}/liquidate")
    public ResultMessage<Void> liquidate(@PathVariable String id) {
        contracts.liquidate(id);
        return ResultUtil.data(null);
    }

    @PutMapping("/contracts/{id}/project-done")
    public ResultMessage<Void> projectDone(@PathVariable String id, @RequestBody ContractRows.ProjectDoneInput body) {
        contracts.setProjectDone(id, body.done());
        return ResultUtil.data(null);
    }

    @PostMapping("/cash-entries")
    public ResultMessage<String> createCash(@RequestBody ContractRows.CashInput body) {
        return ResultUtil.data(contracts.saveCash(null, body));
    }

    @PutMapping("/cash-entries/{id}")
    public ResultMessage<String> updateCash(@PathVariable String id, @RequestBody ContractRows.CashInput body) {
        return ResultUtil.data(contracts.saveCash(id, body));
    }

    @DeleteMapping("/cash-entries/{id}")
    public ResultMessage<Void> deleteCash(@PathVariable String id) {
        contracts.deleteCash(id);
        return ResultUtil.data(null);
    }
}
