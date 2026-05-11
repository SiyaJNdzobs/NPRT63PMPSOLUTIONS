package com.pmp.erank.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Cellphone number is required")
    private String cellphone;

    @NotBlank(message = "Password is required")
    private String password;
}