package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.vldc.files.VldcFileAppService;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Private VLDC attachments (authenticated like all of /api/vldc/**). POST stores files and returns their URLs, which
 * the client then saves on the owner record; GET streams one back only to users who may read the owner.
 * Downloads are always "attachment" with nosniff and no-store, so a file never renders in the browser or a cache.
 */
@RestController
@RequestMapping("/api/vldc/files")
public class VldcFileController {
    private final VldcFileAppService files;

    public VldcFileController(VldcFileAppService files) {
        this.files = files;
    }

    @PostMapping(path = "/{type}/{ownerId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResultMessage<List<String>> upload(@PathVariable String type, @PathVariable String ownerId,
                                              @RequestParam("files") List<MultipartFile> uploads) {
        return ResultUtil.data(files.upload(type, ownerId, uploads));
    }

    /** The trailing name is only for readable URLs; the stored name of fileId is what the download carries. */
    @GetMapping("/{type}/{ownerId}/{fileId}/{name}")
    public ResponseEntity<Resource> download(@PathVariable String type, @PathVariable String ownerId, @PathVariable String fileId) {
        VldcFileAppService.Download file = files.download(type, ownerId, fileId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(file.name(), StandardCharsets.UTF_8).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.noStore().cachePrivate())
                .body(new FileSystemResource(file.path()));
    }
}
