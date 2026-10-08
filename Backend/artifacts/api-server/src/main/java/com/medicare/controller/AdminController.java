package com.medicare.controller;

import com.medicare.dto.ApiDtos.*;
import com.medicare.security.AuthenticatedUser;
import com.medicare.service.AdminService;
import com.medicare.service.CareService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {
    private final AdminService adminService;
    private final CareService careService;

    public AdminController(AdminService adminService, CareService careService) {
        this.adminService = adminService;
        this.careService = careService;
    }

    @GetMapping("/patients")
    public Page<AdminPatient> patients(
        @PageableDefault(size = 50, sort = "userAccount.fullName", direction = Sort.Direction.ASC)
        Pageable pageable
    ) {
        return adminService.allPatients(capped(pageable));
    }

    @GetMapping("/doctors")
    public Page<AdminDoctor> doctors(@PageableDefault(size = 50) Pageable pageable) {
        return adminService.allDoctors(capped(pageable));
    }

    @PostMapping("/doctors/{doctorId}/approve")
    public AdminDoctor approveDoctor(@PathVariable UUID doctorId) {
        return adminService.approveDoctor(doctorId);
    }

    @GetMapping("/appointments")
    public Page<AppointmentView> appointments(@PageableDefault(size = 50) Pageable pageable) {
        return adminService.allAppointments(capped(pageable));
    }

    @PatchMapping("/appointments/{appointmentId}/status")
    public AppointmentView updateAppointmentStatus(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable UUID appointmentId,
        @RequestBody AppointmentStatusUpdate request
    ) {
        return careService.updateAppointmentStatus(user, appointmentId, request.status());
    }

    @GetMapping("/statistics")
    public AdminStatistics statistics() {
        return adminService.statistics();
    }

    private Pageable capped(Pageable pageable) {
        return PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 100),
            pageable.getSort());
    }
}