package com.xxxx.ddd.domain.model.entity.vldc;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

/** One version of a DMS document (tbl_dms_document_version); fileUrl is null for an imported entry without file. */
@Getter
@Setter
@Accessors(chain = true)
@Embeddable
public class DmsDocumentVersion {
    @Column(nullable = false)
    private int version;

    @Column(name = "file_url", length = 512)
    private String fileUrl;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "uploaded_by")
    private String uploadedBy;

    @Column(name = "uploaded_at", nullable = false, length = 40)
    private String uploadedAt;

    @Column(length = 500)
    private String note;
}
