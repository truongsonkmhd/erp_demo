package com.xxxx.ddd.application.hr;

/** One line of a person's transfer history; units are labels ("Tổ đo điện – ĐVL Mặt đất"). */
public record TransferDTO(String date, String from, String to, String note, String by) {
}
