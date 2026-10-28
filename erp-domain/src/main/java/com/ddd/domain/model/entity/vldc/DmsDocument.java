package com.xxxx.ddd.domain.model.entity.vldc;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;

/** DMS document; every version keeps the URL of its file on the backend's disk (never the file itself). */
@Getter
@Setter
@Accessors(chain = true)
@Entity
@Table(name = "tbl_dms_document")
public class DmsDocument extends BaseRecord {
    @Column(name = "project_id", nullable = false, length = 64)
    private String projectId;

    @Column(name = "folder_id", nullable = false, length = 64)
    private String folderId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 16)
    private String format;

    @Column(nullable = false, length = 32)
    private String status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "JSON")
    private List<String> tags = new ArrayList<>();

    /** Current version number. */
    @Column(nullable = false)
    private int version;

    /** Display name of the author. */
    @Column(nullable = false)
    private String author;

    /** Username holding the check-out lock, and their display name. */
    @Column(name = "checked_out_by")
    private String checkedOutBy;

    @Column(name = "checked_out_name")
    private String checkedOutName;

    /** "yyyy-mm-dd" of the last change, as DmsFile.updatedAt. */
    @Column(name = "doc_updated_at", nullable = false, length = 10)
    private String docUpdatedAt;

    @Column(name = "created_by")
    private String createdBy;

    @ElementCollection
    @CollectionTable(name = "tbl_dms_document_version", joinColumns = @JoinColumn(name = "document_id"))
    @OrderBy("version ASC")
    private List<DmsDocumentVersion> versions = new ArrayList<>();
}
