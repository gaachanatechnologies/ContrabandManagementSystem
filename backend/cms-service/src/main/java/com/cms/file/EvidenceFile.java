package com.cms.file;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "evidence_files")
public class EvidenceFile {
  @Id
  private String id = UUID.randomUUID().toString();
  private String contrabandId;
  private String fileName;
  private String fileType;
  private Long fileSize;
  private String fileUrl;
  private String uploadedBy;
  private String description;
  private Instant uploadedAt = Instant.now();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getContrabandId() { return contrabandId; }
  public void setContrabandId(String contrabandId) { this.contrabandId = contrabandId; }
  public String getFileName() { return fileName; }
  public void setFileName(String fileName) { this.fileName = fileName; }
  public String getFileType() { return fileType; }
  public void setFileType(String fileType) { this.fileType = fileType; }
  public Long getFileSize() { return fileSize; }
  public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
  public String getFileUrl() { return fileUrl; }
  public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
  public String getUploadedBy() { return uploadedBy; }
  public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public Instant getUploadedAt() { return uploadedAt; }
  public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }
}