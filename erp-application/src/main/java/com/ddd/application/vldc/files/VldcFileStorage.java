package com.xxxx.ddd.application.vldc.files;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Files on the backend's own disk: {root}/{type}/{ownerId}/{fileId}. The disk name is a random UUID (never the
 * uploaded name), the root is outside every web root, and every path is checked to stay inside it.
 * The URL kept in the database is /api/vldc/files/{type}/{ownerId}/{fileId}/{encoded original name}.
 */
@Component
public class VldcFileStorage {
    public static final String URL_PREFIX = "/api/vldc/files/";
    static final Pattern SEGMENT = Pattern.compile("^[A-Za-z0-9_.:-]{1,64}$");
    private static final Pattern FILE_ID = Pattern.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");
    private static final Pattern URL = Pattern.compile("^" + Pattern.quote(URL_PREFIX) + "([^/]+)/([^/]+)/([^/]+)/([^/]+)$");

    private final Path root;

    public VldcFileStorage(@Value("${vldc.files.root:./data/uploads}") String root) {
        this.root = Path.of(root).toAbsolutePath().normalize();
    }

    /** Parts of a stored file URL, or empty when the string is not one (e.g. a legacy plain file name). */
    public record FileRef(String type, String ownerId, String fileId, String name) {
        public String url() {
            return URL_PREFIX + type + "/" + ownerId + "/" + fileId + "/" + URLEncoder.encode(name, StandardCharsets.UTF_8).replace("+", "%20");
        }
    }

    public static Optional<FileRef> parse(String url) {
        if (url == null) return Optional.empty();
        Matcher m = URL.matcher(url);
        if (!m.matches()) return Optional.empty();
        if (!SEGMENT.matcher(m.group(1)).matches() || !SEGMENT.matcher(m.group(2)).matches() || !FILE_ID.matcher(m.group(3)).matches()) {
            return Optional.empty();
        }
        return Optional.of(new FileRef(m.group(1), m.group(2), m.group(3), URLDecoder.decode(m.group(4), StandardCharsets.UTF_8)));
    }

    /** Writes the stream under a new random id and returns its reference. */
    public FileRef save(String type, String ownerId, String name, InputStream content) {
        FileRef ref = new FileRef(type, ownerId, UUID.randomUUID().toString(), name);
        Path target = pathOf(ref);
        try {
            Files.createDirectories(target.getParent());
            Path temp = Files.createTempFile(target.getParent(), "upload-", ".part");
            try {
                Files.copy(content, temp, StandardCopyOption.REPLACE_EXISTING);
                Files.move(temp, target, StandardCopyOption.ATOMIC_MOVE);
            } finally {
                Files.deleteIfExists(temp);
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Không lưu được file", e);
        }
        return ref;
    }

    /** Duplicates a stored file under a new random id (a copy is independent: deleting one keeps the other). */
    public FileRef copy(FileRef from, String name) {
        Path source = find(from).orElseThrow(() -> new IllegalArgumentException("File gốc không còn trên máy chủ"));
        try (InputStream in = Files.newInputStream(source)) {
            return save(from.type(), from.ownerId(), name, in);
        } catch (IOException e) {
            throw new UncheckedIOException("Không sao chép được file", e);
        }
    }

    public Optional<Path> find(FileRef ref) {
        Path path = pathOf(ref);
        return Files.isRegularFile(path) ? Optional.of(path) : Optional.empty();
    }

    /** Best effort: a file that is already gone is fine. */
    public void delete(FileRef ref) {
        try {
            Files.deleteIfExists(pathOf(ref));
        } catch (IOException ignored) {
            // An orphan file on disk is harmless: it is never served once its URL left the owner.
        }
    }

    private Path pathOf(FileRef ref) {
        if (!SEGMENT.matcher(ref.type()).matches() || !SEGMENT.matcher(ref.ownerId()).matches() || !FILE_ID.matcher(ref.fileId()).matches()) {
            throw new IllegalArgumentException("Invalid file reference");
        }
        Path path = root.resolve(ref.type()).resolve(ref.ownerId()).resolve(ref.fileId()).normalize();
        if (!path.startsWith(root)) throw new IllegalArgumentException("Invalid file reference");
        return path;
    }
}
