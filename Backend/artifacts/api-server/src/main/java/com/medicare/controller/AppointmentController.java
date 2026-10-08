package com.medicare.controller;

import com.medicare.dto.ApiDtos.*;
import com.medicare.security.AuthenticatedUser;
import com.medicare.service.CareService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {
    private final CareService careService;

    public AppointmentController(CareService careService) {
        this.careService = careService;
    }

    @GetMapping("/availability")
    public AvailabilityResult checkAvailability(
        @RequestParam UUID doctorId,
        @RequestParam Instant startsAt,
        @RequestParam Instant endsAt
    ) {
        return careService.checkAvailability(doctorId, startsAt, endsAt);
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentView book(@AuthenticationPrincipal AuthenticatedUser user,
                                @Valid @RequestBody AppointmentCreate request) {
        return careService.bookAppointment(user.id(), request);
    }

    @GetMapping("/{appointmentId}")
    @SecurityRequirement(name = "bearerAuth")
    public AppointmentView get(@AuthenticationPrincipal AuthenticatedUser user,
                               @PathVariable UUID appointmentId) {
        return careService.getAppointment(user, appointmentId);
    }

    @PostMapping("/{appointmentId}/cancel")
    @SecurityRequirement(name = "bearerAuth")
    public AppointmentView cancel(@AuthenticationPrincipal AuthenticatedUser user,
                                  @PathVariable UUID appointmentId) {
        return careService.cancelAppointment(user, appointmentId);
    }

    @PatchMapping("/{appointmentId}/status")
    @SecurityRequirement(name = "bearerAuth")
    public AppointmentView updateStatus(@AuthenticationPrincipal AuthenticatedUser user,
                                        @PathVariable UUID appointmentId,
                                        @Valid @RequestBody AppointmentStatusUpdate request) {
        return careService.updateAppointmentStatus(user, appointmentId, request.status());
    }

    @PostMapping("/{appointmentId}/prescriptions")
    @SecurityRequirement(name = "bearerAuth")
    @ResponseStatus(HttpStatus.CREATED)
    public PrescriptionView createPrescription(@AuthenticationPrincipal AuthenticatedUser user,
                                               @PathVariable UUID appointmentId,
                                               @Valid @RequestBody PrescriptionCreate request) {
        return careService.createPrescription(user.id(), appointmentId, request);
    }
}