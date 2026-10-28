package com.xxxx.ddd.application.hr;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Hồ sơ nhân sự in the shape of the frontend StaffProfile (erp-frontend.com/src/features/vldc/data/types.ts).
 * unit = đơn vị code, subUnit = tổ/phòng code or "" when the person sits directly in the unit.
 * account / accountActive are read-only: accounts are managed on the Tài khoản page.
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StaffProfileRow {
    @NotBlank
    @Pattern(regexp = "[A-Za-z0-9_.-]{1,20}")
    private String id;

    @NotBlank
    @Size(max = 150)
    private String name;

    @NotNull
    @Min(1940)
    @Max(2015)
    private Integer birthYear;

    @NotBlank
    @Pattern(regexp = "Tiến sĩ|Thạc sĩ|Kỹ sư/Cử nhân|KTV/Công nhân")
    private String education;

    @NotBlank
    @Size(max = 150)
    private String major;

    /** Years of work; stored as the year work started. */
    @NotNull
    @Min(0)
    @Max(60)
    private Integer experience;

    @NotBlank
    @Size(max = 50)
    private String unit;

    @NotBlank
    @Size(max = 100)
    private String title;

    @Valid
    @Size(max = 30)
    private List<Certificate> certs = new ArrayList<>();

    private boolean onField;

    @Size(max = 50)
    private String subUnit;

    @Pattern(regexp = "Nam|Nữ")
    private String gender;

    @Pattern(regexp = "[0-9+ .()-]{0,20}")
    private String phone;

    @Email
    @Size(max = 150)
    private String email;

    /** DANG_LAM (default), TAM_NGHI or NGHI_VIEC. */
    @Pattern(regexp = "DANG_LAM|TAM_NGHI|NGHI_VIEC")
    private String status;

    /** yyyy-mm-dd, set when status is NGHI_VIEC. */
    @Pattern(regexp = "[0-9]{4}-[0-9]{2}-[0-9]{2}")
    private String leftAt;

    /** Reason written into the transfer history when unit/subUnit changes. */
    @Size(max = 500)
    private String transferNote;

    private String account;
    private Boolean accountActive;

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Certificate {
        @NotBlank
        @Size(max = 200)
        private String name;

        /** yyyy-mm-dd; empty = no expiry. */
        @Pattern(regexp = "([0-9]{4}-[0-9]{2}-[0-9]{2})?")
        private String expiry;

        @Size(max = 50)
        private String number;

        @Size(max = 200)
        private String issuedBy;
    }
}
