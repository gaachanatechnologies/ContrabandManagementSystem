package com.cms.contraband;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "contraband_categories")
public class Category {
  @Id
  private String id = UUID.randomUUID().toString();
  @Column(unique = true, nullable = false)
  private String name;
  private String description;
  private String riskLevel;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public String getRiskLevel() { return riskLevel; }
  public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
}