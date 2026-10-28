package com.xxxx.ddd.application.work;

import com.xxxx.ddd.application.exception.ConflictException;

import java.util.function.Predicate;
import java.util.regex.Pattern;

/**
 * Mã nghiệp vụ do người dùng nhập (dự án, việc, việc con, nhiệm vụ): bắt buộc, tối đa 30 ký tự, chỉ chữ, số và "- _ ."
 * (mã nằm trong đường dẫn trang nên không có "/" hay khoảng trắng), không trùng trong cùng bảng. Mã không đổi sau khi tạo.
 */
public final class WorkCodes {
    public static final int MAX_LENGTH = 30;
    private static final Pattern ALLOWED = Pattern.compile("[A-Za-z0-9._-]+");

    private WorkCodes() {
    }

    /** The code trimmed; invalid input is a 400. */
    public static String normalize(String code, String label) {
        String value = code == null ? "" : code.trim();
        if (value.isEmpty()) throw new IllegalArgumentException("Vui lòng nhập mã " + label);
        if (value.length() > MAX_LENGTH) throw new IllegalArgumentException("Mã " + label + " tối đa " + MAX_LENGTH + " ký tự");
        if (!ALLOWED.matcher(value).matches()) {
            throw new IllegalArgumentException("Mã " + label + " chỉ gồm chữ, số và các ký tự - _ .");
        }
        return value;
    }

    /** The trimmed code when it is valid and not taken yet; a code already used is a 409. */
    public static String requireNew(String code, String label, Predicate<String> exists) {
        String value = normalize(code, label);
        if (exists.test(value)) throw new ConflictException("Mã " + label + " " + value + " đã tồn tại");
        return value;
    }
}
