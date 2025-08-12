package com.cms.auth;

import com.cms.security.JwtService;
import com.cms.user.User;
import com.cms.user.UserRepository;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private final UserRepository userRepository;
  private final JwtService jwtService;
  private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public AuthController(UserRepository userRepository, JwtService jwtService) {
    this.userRepository = userRepository;
    this.jwtService = jwtService;
  }

  public record LoginRequest(@Email String email, @NotBlank String password) {}

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    var userOpt = userRepository.findByEmail(request.email());
    if (userOpt.isEmpty()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
    }
    var user = userOpt.get();
    if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
    }
    Map<String, Object> claims = new HashMap<>();
    claims.put("email", user.getEmail());
    claims.put("role", user.getRole());
    claims.put("full_name", user.getFullName());
    String token = jwtService.generateToken(user.getId(), claims);
    return ResponseEntity.ok(Map.of(
        "token", token,
        "user", Map.of(
            "id", user.getId(),
            "email", user.getEmail(),
            "full_name", user.getFullName(),
            "role", user.getRole(),
            "badge_number", user.getBadgeNumber(),
            "department", user.getDepartment(),
            "phone", user.getPhone(),
            "is_active", user.isActive()
        )
    ));
  }

  public record RegisterRequest(@Email String email, @NotBlank String password, @NotBlank String fullName, String role,
                                String badgeNumber, String department, String phone) {}

  @PostMapping("/register")
  public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
    if (userRepository.findByEmail(request.email()).isPresent()) {
      return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already exists"));
    }
    User user = new User();
    user.setEmail(request.email());
    user.setFullName(request.fullName());
    user.setRole(request.role() != null ? request.role() : "field_officer");
    user.setBadgeNumber(request.badgeNumber());
    user.setDepartment(request.department());
    user.setPhone(request.phone());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    userRepository.save(user);
    return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", user.getId()));
  }
}