package com.medicare.service;

import com.medicare.common.ApiException;
import com.medicare.domain.*;
import com.medicare.dto.ApiDtos.*;
import com.medicare.repository.*;
import com.medicare.security.JwtService;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserAccountRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final SpecializationRepository specializationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserAccountRepository userRepository, PatientRepository patientRepository,
                       DoctorRepository doctorRepository, SpecializationRepository specializationRepository,
                       PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.specializationRepository = specializationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse registerPatient(PatientRegistration request) {
        ensureEmailAvailable(request.email());
        UserAccount user = userRepository.save(new UserAccount(
            normalizeEmail(request.email()), passwordEncoder.encode(request.password()),
            Role.PATIENT, request.fullName().trim(), request.phone().trim()
        ));
        patientRepository.save(new Patient(user, request.dateOfBirth(), request.address().trim()));
        return issueToken(user);
    }

    @Transactional
    public AuthResponse registerDoctor(DoctorRegistration request) {
        ensureEmailAvailable(request.email());
        List<Specialization> specializations = specializationRepository.findByIdIn(request.specializationIds());
        if (specializations.size() != new HashSet<>(request.specializationIds()).size()) {
            throw ApiException.badRequest("One or more specialization IDs do not exist.");
        }
        UserAccount user = userRepository.save(new UserAccount(
            normalizeEmail(request.email()), passwordEncoder.encode(request.password()),
            Role.DOCTOR, request.fullName().trim(), request.phone().trim()
        ));
        doctorRepository.save(new Doctor(
            user,
            request.licenseNumber().trim(),
            request.biography().trim(),
            request.yearsOfExperience(),
            request.consultationFee(),
            new HashSet<>(specializations)
        ));
        // New doctor accounts remain unapproved until an administrator verifies them.
        return issueToken(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        UserAccount user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
            .orElseThrow(this::invalidCredentials);
        if (!user.isEnabled() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        return issueToken(user);
    }

    private void ensureEmailAvailable(String email) {
        if (userRepository.existsByEmailIgnoreCase(normalizeEmail(email))) {
            throw ApiException.conflict("An account with this email address already exists.");
        }
    }

    private AuthResponse issueToken(UserAccount user) {
        Instant now = Instant.now();
        return new AuthResponse(jwtService.issue(user, now), "Bearer", jwtService.expiresAt(now),
            user.getRole().name());
    }

    private ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
            "Email or password is incorrect.");
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}