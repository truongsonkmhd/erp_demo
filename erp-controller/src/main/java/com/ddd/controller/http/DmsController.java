package com.xxxx.ddd.controller.http;

import com.xxxx.ddd.application.vldc.dms.DmsAppService;
import com.xxxx.ddd.application.vldc.dms.DmsRows;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

/**
 * DMS – hồ sơ điện tử (authenticated like all of /api/vldc/**; scope, depth and lock rules in DmsAppService).
 * Files are downloaded through /api/vldc/files/dms/{projectId}/{fileId}/{name}.
 */
@RestController
@RequestMapping("/api/vldc/dms")
public class DmsController {
    private final DmsAppService dms;

    public DmsController(DmsAppService dms) {
        this.dms = dms;
    }

    @GetMapping
    public ResultMessage<DmsRows.Tree> tree() {
        return ResultUtil.data(dms.tree());
    }

    @PostMapping("/projects/{projectId}/init")
    public ResultMessage<Void> initProject(@PathVariable String projectId, @RequestBody DmsRows.InitProject body) {
        dms.initProject(projectId, body.unit());
        return ResultUtil.data(null);
    }

    @PostMapping("/folders")
    public ResultMessage<DmsRows.Folder> createFolder(@RequestBody DmsRows.CreateFolder body) {
        return ResultUtil.data(dms.createFolder(body));
    }

    @PutMapping("/folders/{id}/name")
    public ResultMessage<Void> renameFolder(@PathVariable String id, @RequestBody DmsRows.Rename body) {
        dms.renameFolder(id, body.name());
        return ResultUtil.data(null);
    }

    /** body.folderId = new parent, null = top level. */
    @PostMapping("/folders/{id}/move")
    public ResultMessage<Void> moveFolder(@PathVariable String id, @RequestBody DmsRows.Target body) {
        dms.moveFolder(id, body.folderId());
        return ResultUtil.data(null);
    }

    @DeleteMapping("/folders/{id}")
    public ResultMessage<Void> deleteFolder(@PathVariable String id) {
        dms.deleteFolder(id);
        return ResultUtil.data(null);
    }

    @PostMapping(path = "/folders/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResultMessage<List<String>> upload(@PathVariable String id, @RequestParam("files") List<MultipartFile> files,
                                              @RequestParam(value = "tags", required = false) String tags) {
        List<String> tagList = tags == null ? List.of() : Arrays.asList(tags.split(","));
        return ResultUtil.data(dms.upload(id, files, tagList));
    }

    @PostMapping(path = "/documents/{id}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResultMessage<Void> newVersion(@PathVariable String id, @RequestParam("file") MultipartFile file,
                                          @RequestParam(value = "note", required = false) String note) {
        dms.newVersion(id, file, note);
        return ResultUtil.data(null);
    }

    @PostMapping("/documents/{id}/checkout")
    public ResultMessage<Void> checkout(@PathVariable String id) {
        dms.checkout(id);
        return ResultUtil.data(null);
    }

    @DeleteMapping("/documents/{id}/checkout")
    public ResultMessage<Void> cancelCheckout(@PathVariable String id) {
        dms.cancelCheckout(id);
        return ResultUtil.data(null);
    }

    @PostMapping("/documents/{id}/copy")
    public ResultMessage<String> copy(@PathVariable String id, @RequestBody DmsRows.Target body) {
        return ResultUtil.data(dms.copy(id, body.folderId()));
    }

    @PostMapping("/documents/{id}/move")
    public ResultMessage<Void> move(@PathVariable String id, @RequestBody DmsRows.Target body) {
        dms.move(id, body.folderId());
        return ResultUtil.data(null);
    }

    @PutMapping("/documents/{id}")
    public ResultMessage<Void> updateMetadata(@PathVariable String id, @RequestBody DmsRows.Metadata body) {
        dms.updateMetadata(id, body);
        return ResultUtil.data(null);
    }

    @DeleteMapping("/documents/{id}")
    public ResultMessage<Void> delete(@PathVariable String id) {
        dms.delete(id);
        return ResultUtil.data(null);
    }
}
