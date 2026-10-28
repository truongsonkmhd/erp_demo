package com.xxxx.ddd.domain.model.enums.work;

/**
 * Độ phức tạp của việc trong dự án; weight là hệ số trong tiến độ dự án
 * (Σ hệ số việc đã hoàn thành / Σ hệ số mọi việc, docs/cong-thuc-tien-do-du-an.md).
 */
public enum Complexity {
    VERY_LOW(1), LOW(2), MEDIUM(3), HIGH(5), VERY_HIGH(8);

    private final int weight;

    Complexity(int weight) {
        this.weight = weight;
    }

    public int weight() {
        return weight;
    }
}
