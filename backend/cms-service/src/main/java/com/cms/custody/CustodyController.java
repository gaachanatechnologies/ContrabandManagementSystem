package com.cms.custody;

import com.cms.user.User;
import com.cms.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/custody")
public class CustodyController {
  private final CustodyRepository custodyRepository;
  private final UserRepository userRepository;

  public CustodyController(CustodyRepository custodyRepository, UserRepository userRepository) {
    this.custodyRepository = custodyRepository;
    this.userRepository = userRepository;
  }

  @GetMapping("/{contrabandId}")
  public List<Map<String, Object>> getChain(@PathVariable String contrabandId) {
    List<CustodyRecord> recs = custodyRepository.findByContrabandIdOrderByTransferDateDesc(contrabandId);
    Map<String, User> userCache = new HashMap<>();
    List<Map<String, Object>> result = new ArrayList<>();
    for (CustodyRecord r : recs) {
      Map<String, Object> map = new LinkedHashMap<>();
      map.put("id", r.getId());
      map.put("contraband_id", r.getContrabandId());
      map.put("from_user_id", r.getFromUserId());
      map.put("to_user_id", r.getToUserId());
      map.put("transfer_reason", r.getTransferReason());
      map.put("transfer_date", r.getTransferDate());
      map.put("location", r.getLocation());
      map.put("notes", r.getNotes());
      if (r.getFromUserId() != null) {
        User fu = userCache.computeIfAbsent(r.getFromUserId(), id -> userRepository.findById(id).orElse(null));
        if (fu != null) map.put("from_user", Map.of("full_name", fu.getFullName(), "badge_number", fu.getBadgeNumber()));
      }
      if (r.getToUserId() != null) {
        User tu = userCache.computeIfAbsent(r.getToUserId(), id -> userRepository.findById(id).orElse(null));
        if (tu != null) map.put("to_user", Map.of("full_name", tu.getFullName(), "badge_number", tu.getBadgeNumber()));
      }
      result.add(map);
    }
    return result;
  }

  @PostMapping("/transfers")
  public ResponseEntity<?> transfer(@RequestBody Map<String, Object> body, Authentication auth) {
    CustodyRecord r = new CustodyRecord();
    r.setContrabandId((String) body.get("contraband_id"));
    r.setFromUserId((String) body.getOrDefault("from_user_id", auth != null ? (String) auth.getPrincipal() : null));
    r.setToUserId((String) body.get("to_user_id"));
    r.setTransferReason((String) body.get("transfer_reason"));
    r.setLocation((String) body.get("location"));
    r.setNotes((String) body.get("notes"));
    custodyRepository.save(r);
    return ResponseEntity.ok(Map.of("id", r.getId()));
  }
}