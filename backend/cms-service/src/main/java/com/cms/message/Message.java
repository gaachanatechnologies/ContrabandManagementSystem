package com.cms.message;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
public class Message {
  @Id
  private String id = UUID.randomUUID().toString();
  private String fromUserId;
  private String toUserId;
  private String subject;
  @Column(length = 5000)
  private String content;
  private String priority; // low, normal, high, urgent
  private String messageType; // general, approval_request, status_update, alert
  private String contrabandId;
  private boolean isRead = false;
  private boolean requiresResponse = false;
  private String parentMessageId;
  private Instant createdAt = Instant.now();
  private Instant readAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getFromUserId() { return fromUserId; }
  public void setFromUserId(String fromUserId) { this.fromUserId = fromUserId; }
  public String getToUserId() { return toUserId; }
  public void setToUserId(String toUserId) { this.toUserId = toUserId; }
  public String getSubject() { return subject; }
  public void setSubject(String subject) { this.subject = subject; }
  public String getContent() { return content; }
  public void setContent(String content) { this.content = content; }
  public String getPriority() { return priority; }
  public void setPriority(String priority) { this.priority = priority; }
  public String getMessageType() { return messageType; }
  public void setMessageType(String messageType) { this.messageType = messageType; }
  public String getContrabandId() { return contrabandId; }
  public void setContrabandId(String contrabandId) { this.contrabandId = contrabandId; }
  public boolean isRead() { return isRead; }
  public void setRead(boolean read) { isRead = read; }
  public boolean isRequiresResponse() { return requiresResponse; }
  public void setRequiresResponse(boolean requiresResponse) { this.requiresResponse = requiresResponse; }
  public String getParentMessageId() { return parentMessageId; }
  public void setParentMessageId(String parentMessageId) { this.parentMessageId = parentMessageId; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getReadAt() { return readAt; }
  public void setReadAt(Instant readAt) { this.readAt = readAt; }
}