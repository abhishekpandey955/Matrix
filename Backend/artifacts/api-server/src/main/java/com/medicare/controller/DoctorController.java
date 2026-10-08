package com.medicare.controller;

import com.medicare.dto.ApiDtos.*;
import com.medicare.security.AuthenticatedUser;
import com.medicare.service.CareService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/doctors")
public class DoctorController {
    private final CareService careService;

    public DoctorController(CareService careService) {
        this.careService = careService;
    }

    @GetMapping("/search")
    public Page<PublicDoctorProfile> search(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String specialization,
        @PageableDefault(size = 20, sort = "userAccount.fullName", direction = Sort.Direction.ASC)
        Pageable pageable
    ) {
        return careService.searchDoctors(q, specialization, capped(pageable));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    public DoctorProfile profile(@AuthenticationPrincipal AuthenticatedUser user) {
        return careService.doctorProfile(user.id());
    }

    @GetMapping("/me/appointments")
    @SecurityRequirement(name = "bearerAuth")
    public List<AppointmentView> appointments(@AuthenticationPrincipal AuthenticatedUser user) {
        return careService.doctorAppointments(user.id());
    }

    @GetMapping("/me/availability")
    @SecurityRequirement(name = "bearerAuth")
    public List<AvailabilityView> ownAvailability(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam Instant from,
        @RequestParam Instant to
    ) {
        return careService.ownAvailability(user.id(), from, to);
    }

    @PostMapping("/me/availability")
    @SecurityRequirement(name = "bearerAuth")
    public AvailabilityView addAvailability(@AuthenticationPrincipal AuthenticatedUser user,
                                            @Valid @RequestBody AvailabilityCreate request) {
        return careService.addAvailability(user.id(), request);
    }

    @DeleteMapping("/me/availability/{availabilityId}")
    @SecurityRequirement(name = "bearerAuth")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void deleteAvailability(@AuthenticationPrincipal AuthenticatedUser user,
                                   @PathVariable UUID availabilityId) {
        careService.deleteAvailability(user.id(), availabilityId);
    }

    @GetMapping("/{doctorId}/availability")
    public List<AvailabilityView> publicAvailability(
        @PathVariable UUID doctorId,
        @RequestParam Instant from,
        @RequestParam Instant to
    ) {
        return careService.doctorAvailability(doctorId, from, to);
    }

    private Pageable capped(Pageable pageable) {
        return PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 100),
            pageable.getSort());
    }
}