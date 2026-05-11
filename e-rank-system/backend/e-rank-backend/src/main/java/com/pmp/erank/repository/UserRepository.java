package com.pmp.erank.repository;

import com.pmp.erank.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByCellphone(String cellphone);
    boolean existsByCellphone(String cellphone);
}