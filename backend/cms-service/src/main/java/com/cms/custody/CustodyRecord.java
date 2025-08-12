package com.cms.custody;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "custody_chain")
public class CustodyRecord {
  @Id
  private String id = UUID.randomUUID().toString();
  private String contrabandId;
  private String fromUserId;
  private String toUserId;
  private String transferReason;
  private Instant transferDate = Instant.now();
  private String location;
  @Column(length = 2000)
  private String notes;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getContrabandId() { return contrabandId; }
  public void setContrabandId(String contrabandId) { this.contrabandId = contrabandId; }
  public String getFromUserId() { return fromUserId; }
  public void setFromUserId(String fromUserId) { this.fromUserId = fromUserId; }
  public String getToUserId() { return toUserId; }
  public void setToUserId(String toUserId) { this.toUserId = toUserId; }
  public String getTransferReason() { return transferReason; }
  public void setTransferReason(String transferReason) { this.transferReason = transferReason; }
  public Instant getTransferDate() { return transferDate; }
  public void setTransferDate(Instant transferDate) { this.transferDate = transferDate; }
  public String getLocation() { return location; }
  public void setLocation(String location) { this.location = location; }
  public String getNotes() { return notes; }
  public void setNotes(String notes) { this.notes = notes; }
}