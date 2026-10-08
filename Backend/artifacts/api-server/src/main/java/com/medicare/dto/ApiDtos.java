package com.medicare.dto;

import com.medicare.domain.AppointmentStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class ApiDtos {
    private ApiDtos() {}

    public record PatientRegistration(
        @NotBlank @Email @Size(max = 320) String email,
        @NotBlank @Size(min = 12, max = 128) String password,
        @NotBlank @Size(max = 160) String fullName,
        @NotBlank @Size(max = 32) String phone,
        @NotNull @Past LocalDate dateOfBirth,
        @NotBlank @Size(max = 500) String address
    ) {}

    public record DoctorRegistration(
        @NotBlank @Email @Size(max = 320) String email,
        @NotBlank @Size(min = 12, max = 128) String password,
        @NotBlank @Size(max = 160) String fullName,
        @NotBlank @Size(max = 32) String phone,
        @NotBlank @Size(max = 100) String licenseNumber,
        @NotBlank @Size(max = 2000) String biography,
        @Min(0) @Max(80) int yearsOfExperience,
        @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal consultationFee,
        @NotEmpty List<@NotNull Long> specializationIds
    ) {}

    public record LoginRequest(
        @NotBlank @Email @Size(max = 320) String email,
        @NotBlank @Size(max = 128) String password
    ) {}

    public record AuthResponse(String accessToken, String tokenType, Instant expiresAt, String role) {}

    public record PatientProfile(
        UUID id, String email, String fullName, String phone, LocalDate dateOfBirth, String address
    ) {}

    public record PatientProfileUpdate(
        @Size(max = 160) String fullName,
        @Size(max = 32) String phone,
        @Past LocalDate dateOfBirth,
        @Size(max = 500) String address
    ) {}

    public record DoctorProfile(
        UUID id, String email, String fullName, String phone, String licenseNumber,
        String biography, int yearsOfExperience, BigDecimal consultationFee,
        boolean approved, List<String> specializations
    ) {}

    public record PublicDoctorProfile(
        UUID id, String fullName, String biography, int yearsOfExperience,
        BigDecimal consultationFee, List<String> specializations
    ) {}

    public record AppointmentCreate(
        @NotNull UUID doctorId,
        @NotNull @Future Instant startsAt,
        @NotNull @Future Instant endsAt
    ) {}

    public record AvailabilityCheck(
        @NotNull UUID doctorId,
        @NotNull @Future Instant startsAt,
        @NotNull @Future Instant endsAt
    ) {}

    public record AvailabilityResult(boolean available) {}

    public record AppointmentStatusUpdate(@NotNull AppointmentStatus status) {}

    public record AppointmentView(
        UUID id, UUID doctorId, String doctorName, UUID patientId, String patientName,
        Instant startsAt, Instant endsAt, AppointmentStatus status
    ) {}

    public record AvailabilityCreate(
        @NotNull @Future Instant startsAt,
        @NotNull @Future Instant endsAt
    ) {}

    public record AvailabilityView(UUID id, UUID doctorId, Instant startsAt, Instant endsAt) {}

    public record PrescriptionCreate(
        @NotBlank @Size(max = 200) String medicationName,
        @NotBlank @Size(max = 200) String dosage,
        @NotBlank @Size(max = 200) String frequency,
        @NotBlank @Size(max = 2000) String instructions,
        @FutureOrPresent LocalDate validUntil
    ) {}

    public record PrescriptionView(
        UUID id, UUID appointmentId, String doctorName, String medicationName,
        String dosage, String frequency, String instructions, LocalDate validUntil,
        Instant issuedAt
    ) {}

    public record AdminPatient(UUID id, String email, String fullName, String phone) {}

    public record AdminDoctor(
        UUID id, String email, String fullName, String licenseNumber, boolean approved,
        List<String> specializations
    ) {}

    public record AdminStatistics(long patientCount, long doctorCount, long appointmentCount) {}

    public record ApiError(String code, String message, Instant timestamp, String path) {}
}