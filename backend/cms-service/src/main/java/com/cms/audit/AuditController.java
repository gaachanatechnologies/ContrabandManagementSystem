package com.cms.audit;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/audit-logs")
public class AuditController {
  private final AuditRepository auditRepository;

  public AuditController(AuditRepository auditRepository) {
    this.auditRepository = auditRepository;
  }

  @GetMapping
  public ResponseEntity<List<AuditLog>> list(Authentication auth) {
    // In a real setup, check ROLE_ADMIN or ROLE_AUDITOR
    return ResponseEntity.ok(auditRepository.findAll());
  }
}