package com.xxxx.ddd.domain.model.auth;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Fixed role-level catalog (selection only — not stored as rows per role).
 */
public enum FixedRoleLevel {
    EXECUTIVE("executive", "Executive", "n", "Cấp Executive"),
    SENIOR("senior", "Senior", "n", "Cấp Senior"),
    MANAGER("manager", "Manager", "n", "Cấp Manager"),
    DIRECTOR("director", "Director", "1", "Cấp Director");

    private final String code;
    private final String name;
    private final String seat;
    private final String description;

    FixedRoleLevel(String code, String name, String seat, String description) {
        this.code = code;
        this.name = name;
        this.seat = seat;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getSeat() {
        return seat;
    }

    public String getDescription() {
        return description;
    }

    public static List<FixedRoleLevel> all() {
        return Arrays.asList(values());
    }

    public static Optional<FixedRoleLevel> fromCode(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        return Arrays.stream(values())
                .filter(item -> item.code.equalsIgnoreCase(code.trim()))
                .findFirst();
    }

    public static FixedRoleLevel require(String code) {
        return fromCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Invalid level: " + code));
    }

    public static String defaultCode() {
        return EXECUTIVE.code;
    }
}
