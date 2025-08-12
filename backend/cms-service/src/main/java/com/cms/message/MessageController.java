package com.cms.message;

import com.cms.contraband.ContrabandItem;
import com.cms.contraband.ContrabandRepository;
import com.cms.user.User;
import com.cms.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/messages")
public class MessageController {
  private final MessageRepository messageRepository;
  private final UserRepository userRepository;
  private final ContrabandRepository contrabandRepository;

  public MessageController(MessageRepository messageRepository, UserRepository userRepository, ContrabandRepository contrabandRepository) {
    this.messageRepository = messageRepository;
    this.userRepository = userRepository;
    this.contrabandRepository = contrabandRepository;
  }

  @GetMapping
  public List<Map<String, Object>> list(@RequestParam String userId) {
    List<Message> msgs = messageRepository.findByFromUserIdOrToUserIdOrderByCreatedAtDesc(userId, userId);
    Map<String, User> userCache = new HashMap<>();
    Map<String, ContrabandItem> contrabandCache = new HashMap<>();

    List<Map<String, Object>> result = new ArrayList<>();
    for (Message m : msgs) {
      Map<String, Object> map = new LinkedHashMap<>();
      map.put("id", m.getId());
      map.put("from_user_id", m.getFromUserId());
      map.put("to_user_id", m.getToUserId());
      map.put("subject", m.getSubject());
      map.put("content", m.getContent());
      map.put("priority", m.getPriority());
      map.put("message_type", m.getMessageType());
      map.put("contraband_id", m.getContrabandId());
      map.put("is_read", m.isRead());
      map.put("requires_response", m.isRequiresResponse());
      map.put("parent_message_id", m.getParentMessageId());
      map.put("created_at", m.getCreatedAt());
      map.put("read_at", m.getReadAt());

      if (m.getFromUserId() != null) {
        User fu = userCache.computeIfAbsent(m.getFromUserId(), id -> userRepository.findById(id).orElse(null));
        if (fu != null) map.put("from_user", Map.of("full_name", fu.getFullName(), "role", fu.getRole(), "badge_number", fu.getBadgeNumber()));
      }
      if (m.getToUserId() != null) {
        User tu = userCache.computeIfAbsent(m.getToUserId(), id -> userRepository.findById(id).orElse(null));
        if (tu != null) map.put("to_user", Map.of("full_name", tu.getFullName(), "role", tu.getRole(), "badge_number", tu.getBadgeNumber()));
      }
      if (m.getContrabandId() != null) {
        ContrabandItem ci = contrabandCache.computeIfAbsent(m.getContrabandId(), id -> contrabandRepository.findById(id).orElse(null));
        if (ci != null) map.put("contraband", Map.of("seizure_number", ci.getSeizureNumber(), "item_name", ci.getItemName()));
      }
      result.add(map);
    }
    return result;
  }

  @PostMapping
  public ResponseEntity<?> send(@RequestBody Map<String, Object> body, Authentication auth) {
    Message m = new Message();
    m.setFromUserId((String) body.getOrDefault("from_user_id", auth != null ? (String) auth.getPrincipal() : null));
    m.setToUserId((String) body.get("to_user_id"));
    m.setSubject((String) body.get("subject"));
    m.setContent((String) body.get("content"));
    m.setPriority((String) body.getOrDefault("priority", "normal"));
    m.setMessageType((String) body.getOrDefault("message_type", "general"));
    m.setContrabandId((String) body.get("contraband_id"));
    m.setRequiresResponse(Boolean.parseBoolean(String.valueOf(body.getOrDefault("requires_response", false))));
    messageRepository.save(m);
    return ResponseEntity.ok(Map.of("id", m.getId()));
  }

  @PatchMapping("/{id}/read")
  public ResponseEntity<?> markRead(@PathVariable String id) {
    return messageRepository.findById(id).map(m -> {
      m.setRead(true);
      m.setReadAt(Instant.now());
      messageRepository.save(m);
      return ResponseEntity.ok().build();
    }).orElse(ResponseEntity.notFound().build());
  }
}