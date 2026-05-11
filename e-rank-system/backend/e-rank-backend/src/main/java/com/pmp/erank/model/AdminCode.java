package com.pmp.erank.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "admin_codes")
public class AdminCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "code", unique = true, nullable = false)
    private String code;

    @Column(name = "is_used")
    private Boolean isUsed = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}