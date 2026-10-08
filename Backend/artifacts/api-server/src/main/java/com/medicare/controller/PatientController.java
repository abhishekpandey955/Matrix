package com.medicare.controller;

import com.medicare.dto.ApiDtos.*;
import com.medicare.security.AuthenticatedUser;
import com.medicare.service.CareService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/patients/me")
@SecurityRequirement(name = "bearerAuth")
public class PatientController {
    private final CareService careService;

    public PatientController(CareService careService) {
        this.careService = careService;
    }

    @GetMapping
    public PatientProfile getProfile(@AuthenticationPrincipal AuthenticatedUser user) {
        return careService.patientProfile(user.id());
    }

    @PatchMapping
    public PatientProfile updateProfile(@AuthenticationPrincipal AuthenticatedUser user,
                                        @Valid @RequestBody PatientProfileUpdate update) {
        return careService.updatePatientProfile(user.id(), update);
    }

    @GetMapping("/appointments")
    public List<AppointmentView> appointments(@AuthenticationPrincipal AuthenticatedUser user) {
        return careService.patientAppointments(user.id());
    }

    @GetMapping("/prescriptions")
    public List<PrescriptionView> prescriptions(@AuthenticationPrincipal AuthenticatedUser user) {
        return careService.patientPrescriptions(user.id());
    }
}