package com.pmp.erank.service;

import com.pmp.erank.dto.AuthResponse;
import com.pmp.erank.dto.LoginRequest;
import com.pmp.erank.dto.RegisterRequest;
import com.pmp.erank.model.AdminCode;
import com.pmp.erank.model.Role;
import com.pmp.erank.model.User;
import com.pmp.erank.repository.AdminCodeRepository;
import com.pmp.erank.repository.RoleRepository;
import com.pmp.erank.repository.UserRepository;
import com.pmp.erank.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AdminCodeRepository adminCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByCellphone(request.getCellphone())) {
            throw new RuntimeException("Cellphone number already registered");
        }

        if (request.getRole().equalsIgnoreCase("admin")) {
            if (request.getAdminCode() == null || request.getAdminCode().isBlank()) {
                throw new RuntimeException("Admin secret code is required");
            }
            AdminCode adminCode = adminCodeRepository
                    .findByCode(request.getAdminCode())
                    .orElseThrow(() -> new RuntimeException("Invalid admin secret code"));

            if (adminCode.getIsUsed()) {
                throw new RuntimeException("Admin secret code has already been used");
            }

            adminCode.setIsUsed(true);
            adminCodeRepository.save(adminCode);
        }

        Role role = roleRepository
                .findByRoleName(request.getRole().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Role not found: " + request.getRole()));

        User user = new User();
        user.setFullNames(request.getFullNames());
        user.setCellphone(request.getCellphone());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getCellphone(), role.getRoleName());

        return new AuthResponse(
                token,
                role.getRoleName(),
                user.getFullNames(),
                user.getCellphone(),
                "Registration successful"
        );
    }

    public AuthResponse login(LoginRequest request) {

        User user = userRepository
                .findByCellphone(request.getCellphone())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid password");
        }

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        String token = jwtUtil.generateToken(
                user.getCellphone(),
                user.getRole().getRoleName()
        );

        return new AuthResponse(
                token,
                user.getRole().getRoleName(),
                user.getFullNames(),
                user.getCellphone(),
                "Login successful"
        );
    }
}