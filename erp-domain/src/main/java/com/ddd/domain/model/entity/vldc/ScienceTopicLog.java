package com.xxxx.ddd.domain.model.entity.vldc;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** One progress update of a science topic (tbl_science_topic_log). */
@Getter
@Setter
@Accessors(chain = true)
@Embeddable
public class ScienceTopicLog {
    @Column(nullable = false, length = 40)
    private String at;

    @Column(name = "by_role", nullable = false, length = 64)
    private String byRole;

    @Column(name = "by_name", nullable = false)
    private String byName;

    @Column(nullable = false)
    private int progress;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String note;
}
