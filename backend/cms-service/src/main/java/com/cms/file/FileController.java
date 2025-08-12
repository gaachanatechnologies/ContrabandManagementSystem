package com.cms.file;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/files")
public class FileController {

  private final EvidenceFileRepository evidenceFileRepository;
  private final Path uploadDir;
  private final String publicBaseUrl;

  public FileController(EvidenceFileRepository evidenceFileRepository,
                        @Value("${user.dir}") String userDir) throws IOException {
    this.evidenceFileRepository = evidenceFileRepository;
    this.uploadDir = Paths.get(userDir, "uploads");
    Files.createDirectories(uploadDir);
    this.publicBaseUrl = "/api/files";
  }

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<?> upload(
      @RequestParam("file") MultipartFile file,
      @RequestParam("contraband_id") String contrabandId,
      @RequestParam(value = "description", required = false) String description,
      @RequestParam(value = "uploaded_by", required = false) String uploadedBy
  ) throws IOException {
    String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
    String fileName = UUID.randomUUID() + (ext != null ? "." + ext : "");
    Path dest = uploadDir.resolve(fileName);
    Files.copy(file.getInputStream(), dest);

    String url = publicBaseUrl + "/" + fileName;

    EvidenceFile ef = new EvidenceFile();
    ef.setContrabandId(contrabandId);
    ef.setFileName(fileName);
    ef.setFileType(file.getContentType());
    ef.setFileSize(file.getSize());
    ef.setFileUrl(url);
    ef.setUploadedBy(uploadedBy);
    ef.setDescription(description);
    evidenceFileRepository.save(ef);

    return ResponseEntity.ok(Map.of("file_url", url, "file_name", fileName));
  }

  @GetMapping(value = "/{fileName}")
  public ResponseEntity<byte[]> serve(@PathVariable String fileName) throws IOException {
    Path path = uploadDir.resolve(fileName);
    if (!Files.exists(path)) return ResponseEntity.notFound().build();
    byte[] bytes = Files.readAllBytes(path);
    return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM).body(bytes);
  }
}