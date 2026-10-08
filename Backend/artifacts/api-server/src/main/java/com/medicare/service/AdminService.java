package com.medicare.service;

import com.medicare.common.ApiException;
import com.medicare.domain.*;
import com.medicare.dto.ApiDtos.*;
import com.medicare.repository.*;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserAccountRepository userRepository;

    public AdminService(PatientRepository patientRepository, DoctorRepository doctorRepository,
                       AppointmentRepository appointmentRepository, UserAccountRepository userRepository) {
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<AdminPatient> allPatients(Pageable pageable) {
        return patientRepository.findAll(pageable).map(patient -> new AdminPatient(
            patient.getId(), patient.getUserAccount().getEmail(),
            patient.getUserAccount().getFullName(), patient.getUserAccount().getPhone()
        ));
    }

    @Transactional(readOnly = true)
    public Page<AdminDoctor> allDoctors(Pageable pageable) {
        return doctorRepository.findAll(pageable).map(this::toAdminDoctor);
    }

    @Transactional
    public AdminDoctor approveDoctor(UUID doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> ApiException.notFound("Doctor not found."));
        doctor.setApproved(true);
        return toAdminDoctor(doctor);
    }

    @Transactional(readOnly = true)
    public Page<AppointmentView> allAppointments(Pageable pageable) {
        return appointmentRepository.findAll(pageable).map(appointment -> new AppointmentView(
            appointment.getId(), appointment.getDoctor().getId(),
            appointment.getDoctor().getUserAccount().getFullName(),
            appointment.getPatient().getId(),
            appointment.getPatient().getUserAccount().getFullName(),
            appointment.getStartsAt(), appointment.getEndsAt(), appointment.getStatus()
        ));
    }

    @Transactional(readOnly = true)
    public AdminStatistics statistics() {
        return new AdminStatistics(
            userRepository.countByRole(Role.PATIENT),
            userRepository.countByRole(Role.DOCTOR),
            appointmentRepository.count()
        );
    }

    private AdminDoctor toAdminDoctor(Doctor doctor) {
        return new AdminDoctor(
            doctor.getId(),
            doctor.getUserAccount().getEmail(),
            doctor.getUserAccount().getFullName(),
            doctor.getLicenseNumber(),
            doctor.isApproved(),
            doctor.getSpecializations().stream().map(Specialization::getName).sorted().toList()
        );
    }
}