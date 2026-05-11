package com.pmp.erank.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String role;
    private String fullNames;
    private String cellphone;
    private String message;
}