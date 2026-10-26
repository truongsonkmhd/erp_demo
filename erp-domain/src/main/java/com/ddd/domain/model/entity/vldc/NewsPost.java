package com.xxxx.ddd.domain.model.entity.vldc;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** Bảng tin post (collection "news"). Dates stay the strings the frontend sends. */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_news")
public class NewsPost extends BaseRecord {
    @Column(nullable = false, length = 32)
    private String kind;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, length = 1000)
    private String summary;

    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String body;

    @Column(nullable = false, length = 32)
    private String audience;

    @Column(nullable = false)
    private boolean pinned;

    @Column(nullable = false, length = 16)
    private String status;

    @Column(name = "author_role", nullable = false, length = 64)
    private String authorRole;

    @Column(name = "author_name", nullable = false)
    private String authorName;

    @Column(name = "published_at", length = 40)
    private String publishedAt;

    /** NewsPost.updatedAt of the frontend (the post's own edit time, not the audit column). */
    @Column(name = "edited_at", nullable = false, length = 40)
    private String editedAt;

    @Column(name = "event_date", length = 10)
    private String eventDate;

    @Column(name = "event_time", length = 8)
    private String eventTime;

    @Column(name = "event_location")
    private String eventLocation;
}
