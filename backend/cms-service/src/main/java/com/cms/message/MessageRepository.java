package com.cms.message;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, String> {
  List<Message> findByFromUserIdOrToUserIdOrderByCreatedAtDesc(String fromUserId, String toUserId);
}