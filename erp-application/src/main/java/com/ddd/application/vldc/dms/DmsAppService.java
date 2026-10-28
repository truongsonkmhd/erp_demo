package com.xxxx.ddd.application.vldc.dms;

import com.xxxx.ddd.application.exception.NotFoundException;
import com.xxxx.ddd.application.vldc.CollectionChangedEvent;
import com.xxxx.ddd.application.vldc.files.VldcFileAppService;
import com.xxxx.ddd.application.vldc.files.VldcFileStorage;
import com.xxxx.ddd.domain.model.entity.vldc.DmsDocument;
import com.xxxx.ddd.domain.model.entity.vldc.DmsDocumentVersion;
import com.xxxx.ddd.domain.model.entity.vldc.DmsFolder;
import com.xxxx.ddd.domain.respository.vldc.DmsDocumentRepository;
import com.xxxx.ddd.domain.respository.vldc.DmsFolderRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * DMS – hồ sơ điện tử theo dự án. Every change goes through here: the client never writes folder or document rows
 * itself, so it cannot set a file URL, a level or a project. Folders nest at most 3 levels; copy and move stay inside
 * one project; files live on the backend's disk (VldcFileStorage, type "dms", owner = project) and only their URLs
 * are stored. Each change is announced on /topic/vldc/dms so open pages re-fetch.
 */
@Service
public class DmsAppService {
    public static final String COLLECTION = "dms";
    /** Standard top-level folders of every project dossier. */
    public static final List<String> STANDARD_FOLDERS = List.of(
            "01_Pháp lý", "02_Kế hoạch", "03_Kỹ thuật", "04_Hiện trường", "05_Tài chính", "06_Hợp đồng", "07_Nghiệm thu", "08_Báo cáo");
    /** "Current" (hiện hành) comes with the documents imported from the former system. */
    static final Set<String> STATUSES = Set.of("Draft", "Review", "Current", "Approved", "Archived");
    private static final int MAX_FILES_PER_UPLOAD = 10;

    private final DmsFolderRepository folders;
    private final DmsDocumentRepository documents;
    private final DmsScope scope;
    private final VldcFileStorage storage;
    private final ApplicationEventPublisher events;

    public DmsAppService(DmsFolderRepository folders, DmsDocumentRepository documents, DmsScope scope,
                         VldcFileStorage storage, ApplicationEventPublisher events) {
        this.folders = folders;
        this.documents = documents;
        this.scope = scope;
        this.storage = storage;
        this.events = events;
    }

    // ---------- Read

    /** Every folder and document of the projects the caller may see. */
    @Transactional(readOnly = true)
    public DmsRows.Tree tree() {
        DmsScope.Caller caller = scope.current();
        List<DmsFolder> all = folders.findAll();
        Map<String, DmsFolder> byId = all.stream().collect(Collectors.toMap(DmsFolder::getId, Function.identity()));
        List<DmsRows.Folder> visibleFolders = all.stream().filter(f -> caller.canSee(f.getUnit()))
                .map(f -> new DmsRows.Folder(f.getId(), f.getProjectId(), f.getUnit(), f.getParentId(), f.getName(), f.getLevel(),
                        path(f, byId), caller.canDelete(f.getUnit(), f.getCreatedBy())))
                .toList();
        List<DmsRows.Document> visibleDocs = documents.findAll().stream()
                .filter(d -> byId.containsKey(d.getFolderId()) && caller.canSee(byId.get(d.getFolderId()).getUnit()))
                .map(d -> toRow(d, byId, caller))
                .toList();
        return new DmsRows.Tree(visibleFolders, visibleDocs);
    }

    /** Project (owner) of a stored file URL, if the caller may read it: used by the generic file download. */
    @Transactional(readOnly = true)
    public boolean canRead(String projectId) {
        DmsScope.Caller caller = scope.current();
        return folders.findByProjectId(projectId).stream().findFirst().map(f -> caller.canSee(f.getUnit())).orElse(false);
    }

    @Transactional(readOnly = true)
    public List<String> fileUrls(String projectId) {
        return documents.findByProjectId(projectId).stream()
                .flatMap(d -> d.getVersions().stream()).map(DmsDocumentVersion::getFileUrl).filter(Objects::nonNull).toList();
    }

    // ---------- Folders

    /** Creates the standard top-level folders the first time a project is opened; unit is the project's owner. */
    @Transactional
    public void initProject(String projectId, String unit) {
        checkSegment(projectId, "Mã dự án");
        DmsScope.Caller caller = scope.current();
        if (!folders.findByProjectId(projectId).isEmpty()) return;
        if (!scope.isUnit(unit)) throw new IllegalArgumentException("Đơn vị không hợp lệ: " + unit);
        // Only someone who would see the project anyway may open its dossier, so nobody claims another unit's project.
        caller.requireSee(unit);
        List<DmsFolder> created = STANDARD_FOLDERS.stream()
                .map(name -> (DmsFolder) new DmsFolder().setProjectId(projectId).setUnit(unit).setName(name).setLevel(1).setId(newId("FD")))
                .toList();
        folders.saveAll(created);
        changed(created.stream().map(DmsFolder::getId).toList());
    }

    @Transactional
    public DmsRows.Folder createFolder(DmsRows.CreateFolder input) {
        DmsScope.Caller caller = scope.current();
        String name = cleanFolderName(input.name());
        DmsFolder parent = input.parentId() == null ? null : folder(input.parentId());
        String projectId = parent != null ? parent.getProjectId() : input.projectId();
        String unit = parent != null ? parent.getUnit() : projectUnit(projectId);
        caller.requireSee(unit);
        int level = parent == null ? 1 : parent.getLevel() + 1;
        if (level > DmsFolder.MAX_LEVEL) throw new IllegalArgumentException("Thư mục tối đa " + DmsFolder.MAX_LEVEL + " cấp");
        requireFreeName(projectId, input.parentId(), name, null);
        DmsFolder folder = (DmsFolder) new DmsFolder().setProjectId(projectId).setUnit(unit).setParentId(input.parentId())
                .setName(name).setLevel(level).setCreatedBy(caller.username()).setId(newId("FD"));
        folders.save(folder);
        changed(List.of(folder.getId()));
        return new DmsRows.Folder(folder.getId(), projectId, unit, folder.getParentId(), name, level, "", true);
    }

    @Transactional
    public void renameFolder(String id, String newName) {
        DmsScope.Caller caller = scope.current();
        DmsFolder folder = folder(id);
        caller.requireSee(folder.getUnit());
        String name = cleanFolderName(newName);
        requireFreeName(folder.getProjectId(), folder.getParentId(), name, id);
        folders.save(folder.setName(name));
        changed(List.of(id));
    }

    /** Moves a folder with everything below it; the deepest folder must still be at most level 3. */
    @Transactional
    public void moveFolder(String id, String targetParentId) {
        DmsScope.Caller caller = scope.current();
        DmsFolder folder = folder(id);
        caller.requireSee(folder.getUnit());
        DmsFolder target = targetParentId == null ? null : folder(targetParentId);
        if (target != null && !target.getProjectId().equals(folder.getProjectId())) {
            throw new IllegalArgumentException("Chỉ chuyển trong cùng một dự án");
        }
        List<DmsFolder> project = folders.findByProjectId(folder.getProjectId());
        List<DmsFolder> subtree = subtree(folder, project);
        if (target != null && subtree.stream().anyMatch(f -> f.getId().equals(target.getId()))) {
            throw new IllegalArgumentException("Không thể chuyển thư mục vào chính nó hoặc thư mục con của nó");
        }
        int newLevel = target == null ? 1 : target.getLevel() + 1;
        int depthBelow = subtree.stream().mapToInt(DmsFolder::getLevel).max().orElse(folder.getLevel()) - folder.getLevel();
        if (newLevel + depthBelow > DmsFolder.MAX_LEVEL) {
            throw new IllegalArgumentException("Sau khi chuyển sẽ vượt quá " + DmsFolder.MAX_LEVEL + " cấp thư mục");
        }
        requireFreeName(folder.getProjectId(), targetParentId, folder.getName(), id);
        int shift = newLevel - folder.getLevel();
        folder.setParentId(targetParentId);
        subtree.forEach(f -> f.setLevel(f.getLevel() + shift));
        folders.saveAll(subtree);
        changed(subtree.stream().map(DmsFolder::getId).toList());
    }

    /** Only an empty folder can be deleted (no sub-folder, no document). */
    @Transactional
    public void deleteFolder(String id) {
        DmsScope.Caller caller = scope.current();
        DmsFolder folder = folder(id);
        caller.requireDelete(folder.getUnit(), folder.getCreatedBy());
        boolean hasChildren = folders.findByProjectId(folder.getProjectId()).stream().anyMatch(f -> id.equals(f.getParentId()));
        if (hasChildren || documents.existsByFolderId(id)) throw new IllegalArgumentException("Chỉ xóa được thư mục trống");
        folders.delete(folder);
        changed(List.of(id));
    }

    // ---------- Documents

    /** Each file becomes a new document (version 1) in the folder. */
    @Transactional
    public List<String> upload(String folderId, List<MultipartFile> files, List<String> tags) {
        DmsScope.Caller caller = scope.current();
        DmsFolder folder = folder(folderId);
        caller.requireSee(folder.getUnit());
        if (files == null || files.isEmpty()) throw new IllegalArgumentException("Chưa chọn file");
        if (files.size() > MAX_FILES_PER_UPLOAD) throw new IllegalArgumentException("Tối đa " + MAX_FILES_PER_UPLOAD + " file mỗi lần tải");
        List<String> names = files.stream().map(VldcFileAppService::checkUpload).toList();
        List<String> ids = new ArrayList<>();
        for (int i = 0; i < files.size(); i++) {
            VldcFileStorage.FileRef ref = store(folder.getProjectId(), names.get(i), files.get(i));
            DmsDocument doc = (DmsDocument) new DmsDocument().setProjectId(folder.getProjectId()).setFolderId(folderId)
                    .setName(baseName(names.get(i))).setFormat(format(names.get(i))).setStatus("Draft")
                    .setTags(cleanTags(tags)).setVersion(1).setAuthor(caller.name()).setDocUpdatedAt(today())
                    .setCreatedBy(caller.username()).setId(newId("DOC"));
            doc.getVersions().add(version(1, ref, files.get(i).getSize(), caller, "Tải lên"));
            documents.save(doc);
            ids.add(doc.getId());
        }
        changed(ids);
        return ids;
    }

    /** Locks the document for the caller so nobody else uploads a new version meanwhile. */
    @Transactional
    public void checkout(String id) {
        DmsScope.Caller caller = scope.current();
        DmsDocument doc = document(id, caller);
        if (doc.getCheckedOutBy() != null && !doc.getCheckedOutBy().equals(caller.username())) {
            throw new IllegalArgumentException("Tài liệu đang được " + doc.getCheckedOutName() + " check-out");
        }
        documents.save(doc.setCheckedOutBy(caller.username()).setCheckedOutName(caller.name()));
        changed(List.of(id));
    }

    /** Releases the lock without a new version (the holder, the unit head or admin). */
    @Transactional
    public void cancelCheckout(String id) {
        DmsScope.Caller caller = scope.current();
        DmsDocument doc = document(id, caller);
        if (doc.getCheckedOutBy() != null && !doc.getCheckedOutBy().equals(caller.username())) {
            caller.requireDelete(unitOf(doc), null);
        }
        documents.save(doc.setCheckedOutBy(null).setCheckedOutName(null));
        changed(List.of(id));
    }

    /** Check-in with a new version: the document must be free or checked out by the caller; the lock is released. */
    @Transactional
    public void newVersion(String id, MultipartFile file, String note) {
        DmsScope.Caller caller = scope.current();
        DmsDocument doc = document(id, caller);
        if (doc.getCheckedOutBy() != null && !doc.getCheckedOutBy().equals(caller.username())) {
            throw new IllegalArgumentException("Tài liệu đang được " + doc.getCheckedOutName() + " check-out");
        }
        String name = VldcFileAppService.checkUpload(file);
        VldcFileStorage.FileRef ref = store(doc.getProjectId(), name, file);
        int next = doc.getVersion() + 1;
        doc.getVersions().add(version(next, ref, file.getSize(), caller, note == null || note.isBlank() ? "Check-in" : note.trim()));
        documents.save(doc.setVersion(next).setFormat(format(name)).setCheckedOutBy(null).setCheckedOutName(null).setDocUpdatedAt(today()));
        changed(List.of(id));
    }

    /** Copies the current version into another folder of the same project; the file itself is duplicated on disk. */
    @Transactional
    public String copy(String id, String targetFolderId) {
        DmsScope.Caller caller = scope.current();
        DmsDocument doc = document(id, caller);
        DmsFolder target = sameProjectFolder(doc, targetFolderId);
        caller.requireSee(target.getUnit());
        DmsDocumentVersion current = doc.getVersions().stream().filter(v -> v.getVersion() == doc.getVersion()).findFirst().orElse(null);
        String name = freeDocName(doc.getProjectId(), targetFolderId, doc.getName());
        DmsDocument copy = (DmsDocument) new DmsDocument().setProjectId(doc.getProjectId()).setFolderId(targetFolderId).setName(name)
                .setFormat(doc.getFormat()).setStatus(doc.getStatus()).setTags(new ArrayList<>(doc.getTags())).setVersion(1)
                .setAuthor(caller.name()).setDocUpdatedAt(today()).setCreatedBy(caller.username()).setId(newId("DOC"));
        VldcFileStorage.FileRef ref = null;
        if (current != null && current.getFileUrl() != null) {
            VldcFileStorage.FileRef from = VldcFileStorage.parse(current.getFileUrl())
                    .orElseThrow(() -> new IllegalArgumentException("Đường dẫn file không hợp lệ"));
            ref = storage.copy(from, from.name());
            deleteOnRollback(List.of(ref));
        }
        copy.getVersions().add(new DmsDocumentVersion().setVersion(1).setFileUrl(ref == null ? null : ref.url())
                .setFileName(ref == null ? null : ref.name()).setSizeBytes(current == null ? null : current.getSizeBytes())
                .setUploadedBy(caller.name()).setUploadedAt(now()).setNote("Sao chép từ " + doc.getName() + " v" + doc.getVersion()));
        documents.save(copy);
        changed(List.of(copy.getId()));
        return copy.getId();
    }

    @Transactional
    public void move(String id, String targetFolderId) {
        DmsScope.Caller caller = scope.current();
        DmsDocument doc = document(id, caller);
        DmsFolder target = sameProjectFolder(doc, targetFolderId);
        caller.requireSee(target.getUnit());
        if (doc.getCheckedOutBy() != null && !doc.getCheckedOutBy().equals(caller.username())) {
            throw new IllegalArgumentException("Tài liệu đang được " + doc.getCheckedOutName() + " check-out");
        }
        boolean clash = documents.findByProjectId(doc.getProjectId()).stream()
                .anyMatch(d -> !d.getId().equals(id) && d.getFolderId().equals(targetFolderId) && d.getName().equalsIgnoreCase(doc.getName()));
        if (clash) throw new IllegalArgumentException("Thư mục đích đã có tài liệu cùng tên");
        documents.save(doc.setFolderId(targetFolderId));
        changed(List.of(id));
    }

    @Transactional
    public void updateMetadata(String id, DmsRows.Metadata input) {
        DmsScope.Caller caller = scope.current();
        DmsDocument doc = document(id, caller);
        if (input.name() != null) {
            String name = input.name().trim();
            if (name.isEmpty() || name.length() > 255) throw new IllegalArgumentException("Tên tài liệu không hợp lệ");
            doc.setName(name);
        }
        if (input.status() != null) {
            if (!STATUSES.contains(input.status())) throw new IllegalArgumentException("Trạng thái không hợp lệ");
            doc.setStatus(input.status());
        }
        if (input.tags() != null) doc.setTags(cleanTags(input.tags()));
        documents.save(doc.setDocUpdatedAt(today()));
        changed(List.of(id));
    }

    /** Deletes the document and, once committed, every version's file from disk. */
    @Transactional
    public void delete(String id) {
        DmsScope.Caller caller = scope.current();
        DmsDocument doc = document(id, caller);
        caller.requireDelete(unitOf(doc), doc.getCreatedBy());
        List<VldcFileStorage.FileRef> refs = doc.getVersions().stream().map(DmsDocumentVersion::getFileUrl)
                .map(VldcFileStorage::parse).flatMap(Optional::stream).toList();
        documents.delete(doc);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                refs.forEach(storage::delete);
            }
        });
        changed(List.of(id));
    }

    // ---------- Helpers

    private DmsRows.Document toRow(DmsDocument d, Map<String, DmsFolder> byId, DmsScope.Caller caller) {
        DmsFolder folder = byId.get(d.getFolderId());
        List<DmsRows.Version> versions = d.getVersions().stream()
                .map(v -> new DmsRows.Version(v.getVersion(), v.getFileUrl(), v.getFileName(), v.getSizeBytes(), v.getUploadedBy(), v.getUploadedAt(), v.getNote()))
                .toList();
        return new DmsRows.Document(d.getId(), d.getProjectId(), d.getFolderId(), path(folder, byId), d.getName(), d.getFormat(), d.getStatus(),
                List.copyOf(d.getTags()), d.getVersion(), d.getAuthor(), d.getCheckedOutName(), caller.username().equals(d.getCheckedOutBy()),
                d.getDocUpdatedAt(), caller.canDelete(folder.getUnit(), d.getCreatedBy()), versions);
    }

    private static String path(DmsFolder folder, Map<String, DmsFolder> byId) {
        Deque<String> names = new ArrayDeque<>();
        for (DmsFolder f = folder; f != null; f = f.getParentId() == null ? null : byId.get(f.getParentId())) names.addFirst(f.getName());
        return String.join(" / ", names);
    }

    private DmsFolder folder(String id) {
        return folders.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy thư mục"));
    }

    /** The document, after checking the caller sees its project. */
    private DmsDocument document(String id, DmsScope.Caller caller) {
        DmsDocument doc = documents.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy tài liệu"));
        caller.requireSee(unitOf(doc));
        return doc;
    }

    private String unitOf(DmsDocument doc) {
        return folder(doc.getFolderId()).getUnit();
    }

    private String projectUnit(String projectId) {
        return folders.findByProjectId(projectId).stream().findFirst().map(DmsFolder::getUnit)
                .orElseThrow(() -> new NotFoundException("Dự án chưa có hồ sơ điện tử"));
    }

    private DmsFolder sameProjectFolder(DmsDocument doc, String targetFolderId) {
        if (targetFolderId == null) throw new IllegalArgumentException("Chưa chọn thư mục đích");
        DmsFolder target = folder(targetFolderId);
        if (!target.getProjectId().equals(doc.getProjectId())) throw new IllegalArgumentException("Chỉ sao chép / chuyển trong cùng một dự án");
        return target;
    }

    private static List<DmsFolder> subtree(DmsFolder root, List<DmsFolder> project) {
        List<DmsFolder> result = new ArrayList<>(List.of(root));
        for (int i = 0; i < result.size(); i++) {
            String parent = result.get(i).getId();
            project.stream().filter(f -> parent.equals(f.getParentId())).forEach(result::add);
        }
        return result;
    }

    private void requireFreeName(String projectId, String parentId, String name, String exceptId) {
        boolean clash = folders.findByProjectId(projectId).stream()
                .anyMatch(f -> !f.getId().equals(exceptId) && Objects.equals(f.getParentId(), parentId) && f.getName().equalsIgnoreCase(name));
        if (clash) throw new IllegalArgumentException("Đã có thư mục cùng tên ở vị trí này");
    }

    private String freeDocName(String projectId, String folderId, String name) {
        Set<String> taken = documents.findByProjectId(projectId).stream().filter(d -> d.getFolderId().equals(folderId))
                .map(d -> d.getName().toLowerCase(Locale.ROOT)).collect(Collectors.toSet());
        if (!taken.contains(name.toLowerCase(Locale.ROOT))) return name;
        for (int i = 1; ; i++) {
            String candidate = name + (i == 1 ? " (bản sao)" : " (bản sao " + i + ")");
            if (!taken.contains(candidate.toLowerCase(Locale.ROOT))) return candidate;
        }
    }

    /** Writes the upload to disk; the file is removed again if the transaction does not commit. */
    private VldcFileStorage.FileRef store(String projectId, String name, MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            VldcFileStorage.FileRef ref = storage.save(COLLECTION, projectId, name, in);
            deleteOnRollback(List.of(ref));
            return ref;
        } catch (IOException e) {
            throw new UncheckedIOException("Không đọc được file " + name, e);
        }
    }

    private void deleteOnRollback(List<VldcFileStorage.FileRef> refs) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) refs.forEach(storage::delete);
            }
        });
    }

    private static DmsDocumentVersion version(int number, VldcFileStorage.FileRef ref, long size, DmsScope.Caller caller, String note) {
        return new DmsDocumentVersion().setVersion(number).setFileUrl(ref.url()).setFileName(ref.name()).setSizeBytes(size)
                .setUploadedBy(caller.name()).setUploadedAt(now()).setNote(note);
    }

    private void changed(List<String> ids) {
        events.publishEvent(new CollectionChangedEvent(COLLECTION, ids, false));
    }

    static String cleanFolderName(String raw) {
        String name = raw == null ? "" : raw.replaceAll("[\\p{Cntrl}/\\\\\"<>|:*?]", "").trim();
        if (name.isEmpty() || name.length() > 150) throw new IllegalArgumentException("Tên thư mục không hợp lệ (1–150 ký tự, không chứa / \\ : * ? \" < > |)");
        return name;
    }

    private static List<String> cleanTags(List<String> tags) {
        if (tags == null) return new ArrayList<>();
        return tags.stream().map(String::trim).filter(t -> !t.isEmpty() && t.length() <= 50).distinct().limit(20)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private static void checkSegment(String value, String label) {
        if (value == null || !value.matches("^[A-Za-z0-9_.:-]{1,64}$")) throw new IllegalArgumentException(label + " không hợp lệ");
    }

    private static String baseName(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return dot > 0 ? fileName.substring(0, dot) : fileName;
    }

    private static String format(String fileName) {
        return VldcFileAppService.extension(fileName).toUpperCase(Locale.ROOT);
    }

    private static String newId(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
    }

    private static String today() {
        return LocalDate.now().toString();
    }

    private static String now() {
        return LocalDateTime.now().withNano(0).toString();
    }
}
