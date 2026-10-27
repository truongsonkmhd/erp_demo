package com.xxxx.ddd.application.vldc.files;

import com.xxxx.ddd.application.exception.NotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Upload and download of VLDC attachments. Every call needs a signed-in user (/api/vldc/** is authenticated) and the
 * owner's own read/write rule; a file is served only while the owner lists its URL, so removing it from the record
 * revokes access at once. Types are limited to office documents, PDF, images and ZIP.
 */
@Service
public class VldcFileAppService {
    public static final int MAX_FILES_PER_OWNER = 10;
    public static final long MAX_FILE_BYTES = 20L * 1024 * 1024;
    private static final int MAX_NAME_LENGTH = 150;
    /** Extension → Content-Type sent on download (the client's declared type is never trusted). */
    private static final Map<String, String> TYPES = Map.ofEntries(
            Map.entry("pdf", "application/pdf"),
            Map.entry("doc", "application/msword"),
            Map.entry("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            Map.entry("xls", "application/vnd.ms-excel"),
            Map.entry("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
            Map.entry("ppt", "application/vnd.ms-powerpoint"),
            Map.entry("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
            Map.entry("jpg", "image/jpeg"),
            Map.entry("jpeg", "image/jpeg"),
            Map.entry("png", "image/png"),
            Map.entry("zip", "application/zip"));

    private final VldcFileStorage storage;
    private final Map<String, FileOwner> owners = new HashMap<>();

    public VldcFileAppService(VldcFileStorage storage, List<FileOwner> owners) {
        this.storage = storage;
        owners.forEach(owner -> this.owners.put(owner.type(), owner));
    }

    /** A file ready to stream back: path on disk, original name and the Content-Type for it. */
    public record Download(Path path, String name, String contentType) { }

    /** Stores the files, appends their URLs to the owner record and returns them; nothing is kept if that fails. */
    public List<String> upload(String type, String ownerId, List<MultipartFile> files) {
        FileOwner owner = owner(type);
        if (!owner.canWrite(ownerId)) throw new AccessDeniedException("Không có quyền đính kèm file cho " + ownerId);
        if (files == null || files.isEmpty()) throw new IllegalArgumentException("Chưa chọn file");
        long current = owner.attachments(ownerId).stream().filter(url -> VldcFileStorage.parse(url).isPresent()).count();
        if (current + files.size() > MAX_FILES_PER_OWNER) {
            throw new IllegalArgumentException("Tối đa " + MAX_FILES_PER_OWNER + " file cho mỗi hồ sơ");
        }
        List<String> names = files.stream().map(VldcFileAppService::checkUpload).toList();
        List<VldcFileStorage.FileRef> saved = new ArrayList<>();
        try {
            for (int i = 0; i < files.size(); i++) {
                try (InputStream in = files.get(i).getInputStream()) {
                    saved.add(storage.save(type, ownerId, names.get(i), in));
                } catch (IOException e) {
                    throw new UncheckedIOException("Không đọc được file " + names.get(i), e);
                }
            }
            List<String> urls = saved.stream().map(VldcFileStorage.FileRef::url).toList();
            owner.attach(ownerId, urls);
            return urls;
        } catch (RuntimeException e) {
            saved.forEach(storage::delete);
            throw e;
        }
    }

    public Download download(String type, String ownerId, String fileId) {
        FileOwner owner = owner(type);
        if (!owner.canRead(ownerId)) throw new AccessDeniedException("Không có quyền xem file của " + ownerId);
        VldcFileStorage.FileRef ref = owner.attachments(ownerId).stream()
                .map(VldcFileStorage::parse).flatMap(java.util.Optional::stream)
                .filter(r -> r.type().equals(type) && r.ownerId().equals(ownerId) && r.fileId().equals(fileId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Không tìm thấy file"));
        Path path = storage.find(ref).orElseThrow(() -> new NotFoundException("File không còn trên máy chủ"));
        return new Download(path, ref.name(), TYPES.getOrDefault(extension(ref.name()), "application/octet-stream"));
    }

    private FileOwner owner(String type) {
        FileOwner owner = owners.get(type);
        if (owner == null) throw new NotFoundException("Unknown file owner: " + type);
        return owner;
    }

    /** Rejects empty, oversized or unsupported files; returns the cleaned visible name. Shared by every upload path. */
    public static String checkUpload(MultipartFile file) {
        String name = cleanName(file.getOriginalFilename());
        if (file.isEmpty()) throw new IllegalArgumentException("File rỗng: " + name);
        if (file.getSize() > MAX_FILE_BYTES) throw new IllegalArgumentException("File quá 20 MB: " + name);
        if (!TYPES.containsKey(extension(name))) throw new IllegalArgumentException("Không hỗ trợ loại file: " + name);
        return name;
    }

    /** Keeps the visible name only: no folders, no control characters, bounded length. */
    static String cleanName(String raw) {
        String name = Objects.requireNonNullElse(raw, "").replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}\"<>|:*?]", "").trim();
        if (name.isEmpty() || name.equals(".") || name.equals("..")) throw new IllegalArgumentException("Tên file không hợp lệ");
        if (name.length() > MAX_NAME_LENGTH) {
            String ext = extension(name);
            name = name.substring(0, MAX_NAME_LENGTH - ext.length() - 1) + "." + ext;
        }
        return name;
    }

    public static String extension(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
