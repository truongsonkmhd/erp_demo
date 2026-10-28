package com.xxxx.ddd.application.vldc.files;

import java.util.List;

/**
 * A VLDC record type that carries uploaded files (e.g. "science_topics"). It decides who may read and add files,
 * and keeps the files' URLs in its own row; a file is only served while its owner still lists its URL.
 */
public interface FileOwner {
    /** Path segment of /api/vldc/files/{type}/…, the collection name of the owner. */
    String type();

    boolean canRead(String ownerId);

    boolean canWrite(String ownerId);

    /** URLs the owner currently lists (other strings, e.g. legacy file names, are ignored). */
    List<String> attachments(String ownerId);

    /** Appends freshly uploaded URLs to the owner record (server side, so uploaders never rewrite the record). */
    void attach(String ownerId, List<String> urls);
}
