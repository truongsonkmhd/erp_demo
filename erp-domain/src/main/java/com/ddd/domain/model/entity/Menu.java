package com.xxxx.ddd.domain.model.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Sidebar menu node. A group has no page; a leaf points at a page and is shown
 * only when the user holds "{page.code}:access".
 */
@Data
@Entity
@Table(name = "tbl_menu")
public class Menu {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 100)
    private String code;
    @Column(nullable = false, length = 150)
    private String title;
    @Column(length = 50)
    private String icon;
    @Column(name = "parent_id")
    private Long parentId;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "page_id")
    private Page page;
    @Column(nullable = false, length = 50)
    private String module;
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
    @Column(nullable = false)
    private Boolean active = true;
}
