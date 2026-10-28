package com.xxxx.ddd.application.vldc.dms;

import java.util.List;

/** JSON shapes of /api/vldc/dms, same as DmsFolder / DmsDoc in erp-frontend.com/src/features/vldc/data/dmsStore.ts. */
public final class DmsRows {
    private DmsRows() { }

    /** path = folder names from the top level, joined by " / ". */
    public record Folder(String id, String projectId, String unit, String parentId, String name, int level, String path, boolean canDelete) { }

    /** url is null for a version imported without its file. */
    public record Version(int version, String url, String fileName, Long size, String uploadedBy, String uploadedAt, String note) { }

    public record Document(String id, String projectId, String folderId, String folder, String name, String format, String status,
                           List<String> tags, int version, String author, String checkedOutBy, boolean checkedOutByMe,
                           String updatedAt, boolean canDelete, List<Version> versions) { }

    /** Everything the signed-in user may see. */
    public record Tree(List<Folder> folders, List<Document> documents) { }

    public record CreateFolder(String projectId, String parentId, String name) { }

    public record Rename(String name) { }

    /** Target folder of a copy or move; parentId null = top level (folders only). */
    public record Target(String folderId) { }

    public record Metadata(String name, String status, List<String> tags) { }

    public record InitProject(String unit) { }
}
