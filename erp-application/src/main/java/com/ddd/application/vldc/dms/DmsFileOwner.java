package com.xxxx.ddd.application.vldc.dms;

import com.xxxx.ddd.application.vldc.files.FileOwner;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Lets /api/vldc/files/dms/{projectId}/… serve DMS files to those who see the project. Uploads never go through the
 * generic file endpoint: DMS files enter only via DmsAppService (folder, version and lock rules).
 */
@Component
public class DmsFileOwner implements FileOwner {
    private final DmsAppService dms;

    public DmsFileOwner(DmsAppService dms) {
        this.dms = dms;
    }

    public String type() { return DmsAppService.COLLECTION; }

    public boolean canRead(String projectId) { return dms.canRead(projectId); }

    public boolean canWrite(String projectId) { return false; }

    public List<String> attachments(String projectId) { return dms.fileUrls(projectId); }

    public void attach(String projectId, List<String> urls) {
        throw new AccessDeniedException("DMS files are added through /api/vldc/dms");
    }
}
