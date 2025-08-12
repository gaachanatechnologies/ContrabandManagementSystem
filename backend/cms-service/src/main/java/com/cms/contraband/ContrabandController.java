package com.cms.contraband;

import com.cms.audit.AuditLog;
import com.cms.audit.AuditRepository;
import com.cms.user.User;
import com.cms.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping
public class ContrabandController {
  private final ContrabandRepository contrabandRepository;
  private final CategoryRepository categoryRepository;
  private final AuditRepository auditRepository;
  private final UserRepository userRepository;

  public ContrabandController(ContrabandRepository contrabandRepository, CategoryRepository categoryRepository, AuditRepository auditRepository, UserRepository userRepository) {
    this.contrabandRepository = contrabandRepository;
    this.categoryRepository = categoryRepository;
    this.auditRepository = auditRepository;
    this.userRepository = userRepository;
  }

  @GetMapping("/categories")
  public List<Category> categories() { return categoryRepository.findAll(); }

  @GetMapping("/contraband-items")
  public List<Map<String, Object>> list() {
    List<ContrabandItem> items = contrabandRepository.findAll();
    Map<String, Category> categoryById = new HashMap<>();
    Map<String, User> userById = new HashMap<>();

    List<Map<String, Object>> response = new ArrayList<>();
    for (ContrabandItem i : items) {
      Map<String, Object> m = new LinkedHashMap<>();
      m.put("id", i.getId());
      m.put("seizure_number", i.getSeizureNumber());
      m.put("item_name", i.getItemName());
      m.put("description", i.getDescription());
      m.put("quantity", i.getQuantity());
      m.put("unit", i.getUnit());
      m.put("estimated_value", i.getEstimatedValue());
      m.put("status", i.getStatus());
      m.put("seizure_date", i.getSeizureDate());
      m.put("seizure_location", i.getSeizureLocation());
      m.put("storage_location", i.getStorageLocation());
      m.put("seized_by", i.getSeizedBy());
      m.put("barcode", i.getBarcode());

      if (i.getCategoryId() != null) {
        Category c = categoryById.computeIfAbsent(i.getCategoryId(), id -> categoryRepository.findById(id).orElse(null));
        if (c != null) {
          m.put("category", Map.of("name", c.getName(), "risk_level", c.getRiskLevel()));
        }
      }
      if (i.getSeizedBy() != null) {
        User u = userById.computeIfAbsent(i.getSeizedBy(), id -> userRepository.findById(id).orElse(null));
        if (u != null) {
          m.put("seized_by_user", Map.of("full_name", u.getFullName(), "badge_number", u.getBadgeNumber()));
        }
      }
      response.add(m);
    }
    return response;
  }

  @PostMapping("/contraband-items")
  public ResponseEntity<?> create(@Valid @RequestBody Map<String, Object> body, Authentication auth) {
    ContrabandItem item = new ContrabandItem();
    item.setSeizureNumber((String) body.getOrDefault("seizure_number", generateSeizureNumber()));
    item.setItemName((String) body.get("item_name"));
    item.setDescription((String) body.get("description"));
    item.setQuantity(asDouble(body.get("quantity")));
    item.setUnit((String) body.get("unit"));
    item.setEstimatedValue(asDouble(body.get("estimated_value")));
    item.setWeightKg(asDouble(body.get("weight_kg")));
    item.setSeizureLocation((String) body.get("seizure_location"));
    item.setGpsLatitude(asDouble(body.get("gps_latitude")));
    item.setGpsLongitude(asDouble(body.get("gps_longitude")));
    item.setCaseNumber((String) body.get("case_number"));
    item.setBarcode((String) body.get("barcode"));
    item.setStorageLocation((String) body.get("storage_location"));
    item.setSeizedBy((String) body.getOrDefault("seized_by", auth != null ? (String) auth.getPrincipal() : null));
    item.setStatus((String) body.getOrDefault("status", "seized"));
    item.setCategoryId((String) body.get("category_id"));
    item.setSeizureDate(Instant.now());
    contrabandRepository.save(item);

    AuditLog log = new AuditLog();
    log.setUserId(item.getSeizedBy());
    log.setAction("CREATE_SEIZURE");
    log.setTableName("contraband_items");
    log.setRecordId(item.getId());
    log.setNewValuesJson(body.toString());
    auditRepository.save(log);

    return ResponseEntity.ok(Map.of("id", item.getId()));
  }

  @PutMapping("/contraband-items/{id}/status")
  public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, Object> body) {
    return contrabandRepository.findById(id).map(item -> {
      item.setStatus((String) body.get("status"));
      item.setUpdatedAt(Instant.now());
      contrabandRepository.save(item);
      return ResponseEntity.ok().build();
    }).orElse(ResponseEntity.notFound().build());
  }

  private static String generateSeizureNumber() {
    var year = java.time.Year.now().getValue();
    var ts = String.valueOf(System.currentTimeMillis());
    return "CMS-" + year + "-" + ts.substring(ts.length() - 6);
  }

  private static Double asDouble(Object o) {
    if (o == null) return null;
    if (o instanceof Number n) return n.doubleValue();
    try { return Double.parseDouble(o.toString()); } catch (Exception e) { return null; }
  }
}