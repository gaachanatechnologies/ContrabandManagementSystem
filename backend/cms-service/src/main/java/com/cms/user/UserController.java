package com.cms.user;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {
  private final UserRepository userRepository;

  public UserController(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @GetMapping
  public List<User> list() {
    return userRepository.findAll();
  }

  @GetMapping("/me")
  public ResponseEntity<?> me(Authentication auth) {
    String userId = (String) auth.getPrincipal();
    return userRepository.findById(userId)
        .map(u -> ResponseEntity.ok(Map.of(
            "id", u.getId(),
            "email", u.getEmail(),
            "full_name", u.getFullName(),
            "role", u.getRole(),
            "badge_number", u.getBadgeNumber(),
            "department", u.getDepartment(),
            "phone", u.getPhone(),
            "is_active", u.isActive()
        )))
        .orElse(ResponseEntity.notFound().build());
  }

  @PutMapping("/{id}")
  public ResponseEntity<?> update(@PathVariable String id, @Valid @RequestBody Map<String, Object> updates) {
    return userRepository.findById(id).map(u -> {
      if (updates.containsKey("full_name")) u.setFullName((String) updates.get("full_name"));
      if (updates.containsKey("badge_number")) u.setBadgeNumber((String) updates.get("badge_number"));
      if (updates.containsKey("role")) u.setRole((String) updates.get("role"));
      if (updates.containsKey("department")) u.setDepartment((String) updates.get("department"));
      if (updates.containsKey("phone")) u.setPhone((String) updates.get("phone"));
      if (updates.containsKey("is_active")) u.setActive(Boolean.parseBoolean(updates.get("is_active").toString()));
      userRepository.save(u);
      return ResponseEntity.ok().build();
    }).orElse(ResponseEntity.notFound().build());
  }

  @PostMapping
  public ResponseEntity<?> create(@Valid @RequestBody Map<String, Object> body) {
    User user = new User();
    user.setEmail((String) body.get("email"));
    user.setFullName((String) body.get("full_name"));
    user.setBadgeNumber((String) body.get("badge_number"));
    user.setRole((String) body.getOrDefault("role", "field_officer"));
    user.setDepartment((String) body.get("department"));
    user.setPhone((String) body.get("phone"));
    user.setPasswordHash(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode((String) body.getOrDefault("password", "changeme")));
    userRepository.save(user);
    return ResponseEntity.ok(Map.of("id", user.getId()));
  }
}