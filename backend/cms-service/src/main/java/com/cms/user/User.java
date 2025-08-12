package com.cms.user;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {
  @Id
  private String id = UUID.randomUUID().toString();

  @Column(unique = true, nullable = false)
  private String email;

  @Column(nullable = false)
  private String fullName;

  private String badgeNumber;

  @Column(nullable = false)
  private String role; // admin, supervisor, field_officer, warehouse_manager, auditor

  private String department;
  private String phone;
  private boolean isActive = true;

  private Instant createdAt = Instant.now();
  private Instant updatedAt = Instant.now();

  @Column(nullable = false)
  private String passwordHash;

  // Getters and setters
  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getFullName() { return fullName; }
  public void setFullName(String fullName) { this.fullName = fullName; }
  public String getBadgeNumber() { return badgeNumber; }
  public void setBadgeNumber(String badgeNumber) { this.badgeNumber = badgeNumber; }
  public String getRole() { return role; }
  public void setRole(String role) { this.role = role; }
  public String getDepartment() { return department; }
  public void setDepartment(String department) { this.department = department; }
  public String getPhone() { return phone; }
  public void setPhone(String phone) { this.phone = phone; }
  public boolean isActive() { return isActive; }
  public void setActive(boolean active) { isActive = active; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
}