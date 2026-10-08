package com.medicare.controller;

import com.medicare.dto.ApiDtos.*;
import com.medicare.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/patient")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerPatient(@Valid @RequestBody PatientRegistration request) {
        return authService.registerPatient(request);
    }

    @PostMapping("/register/doctor")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerDoctor(@Valid @RequestBody DoctorRegistration request) {
        return authService.registerDoctor(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}