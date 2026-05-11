package com.pmp.erank.repository;

import com.pmp.erank.model.AdminCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AdminCodeRepository extends JpaRepository<AdminCode, Integer> {
    Optional<AdminCode> findByCode(String code);
}
