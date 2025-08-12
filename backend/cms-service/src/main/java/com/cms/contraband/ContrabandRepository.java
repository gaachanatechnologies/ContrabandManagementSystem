package com.cms.contraband;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ContrabandRepository extends JpaRepository<ContrabandItem, String> {
}