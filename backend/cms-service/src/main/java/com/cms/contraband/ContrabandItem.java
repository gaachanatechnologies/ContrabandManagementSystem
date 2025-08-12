package com.cms.contraband;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "contraband_items")
public class ContrabandItem {
  @Id
  private String id = UUID.randomUUID().toString();

  private String seizureNumber;
  private String itemName;
  @Column(length = 2000)
  private String description;
  private Double quantity;
  private String unit;
  private Double estimatedValue;
  private Double weightKg;
  private String status; // seized, in_custody, under_investigation, pending_destruction, destroyed, released
  private Instant seizureDate = Instant.now();
  private String seizureLocation;
  private Double gpsLatitude;
  private Double gpsLongitude;
  private String seizedBy; // user id
  private String caseNumber;
  private String courtCaseNumber;
  private String barcode;
  private String rfidTag;
  private String storageLocation;
  private Instant createdAt = Instant.now();
  private Instant updatedAt = Instant.now();
  private String categoryId;

  // Getters/setters
  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getSeizureNumber() { return seizureNumber; }
  public void setSeizureNumber(String seizureNumber) { this.seizureNumber = seizureNumber; }
  public String getItemName() { return itemName; }
  public void setItemName(String itemName) { this.itemName = itemName; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public Double getQuantity() { return quantity; }
  public void setQuantity(Double quantity) { this.quantity = quantity; }
  public String getUnit() { return unit; }
  public void setUnit(String unit) { this.unit = unit; }
  public Double getEstimatedValue() { return estimatedValue; }
  public void setEstimatedValue(Double estimatedValue) { this.estimatedValue = estimatedValue; }
  public Double getWeightKg() { return weightKg; }
  public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public Instant getSeizureDate() { return seizureDate; }
  public void setSeizureDate(Instant seizureDate) { this.seizureDate = seizureDate; }
  public String getSeizureLocation() { return seizureLocation; }
  public void setSeizureLocation(String seizureLocation) { this.seizureLocation = seizureLocation; }
  public Double getGpsLatitude() { return gpsLatitude; }
  public void setGpsLatitude(Double gpsLatitude) { this.gpsLatitude = gpsLatitude; }
  public Double getGpsLongitude() { return gpsLongitude; }
  public void setGpsLongitude(Double gpsLongitude) { this.gpsLongitude = gpsLongitude; }
  public String getSeizedBy() { return seizedBy; }
  public void setSeizedBy(String seizedBy) { this.seizedBy = seizedBy; }
  public String getCaseNumber() { return caseNumber; }
  public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }
  public String getCourtCaseNumber() { return courtCaseNumber; }
  public void setCourtCaseNumber(String courtCaseNumber) { this.courtCaseNumber = courtCaseNumber; }
  public String getBarcode() { return barcode; }
  public void setBarcode(String barcode) { this.barcode = barcode; }
  public String getRfidTag() { return rfidTag; }
  public void setRfidTag(String rfidTag) { this.rfidTag = rfidTag; }
  public String getStorageLocation() { return storageLocation; }
  public void setStorageLocation(String storageLocation) { this.storageLocation = storageLocation; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
  public String getCategoryId() { return categoryId; }
  public void setCategoryId(String categoryId) { this.categoryId = categoryId; }
}