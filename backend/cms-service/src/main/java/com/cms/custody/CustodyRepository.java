package com.cms.custody;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustodyRepository extends JpaRepository<CustodyRecord, String> {
  List<CustodyRecord> findByContrabandIdOrderByTransferDateDesc(String contrabandId);
}