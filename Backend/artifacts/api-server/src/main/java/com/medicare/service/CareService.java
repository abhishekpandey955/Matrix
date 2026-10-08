package com.medicare.service;

import com.medicare.common.ApiException;
import com.medicare.domain.*;
import com.medicare.dto.ApiDtos.*;
import com.medicare.repository.*;
import com.medicare.security.AuthenticatedUser;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CareService {
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;

    public CareService(PatientRepository patientRepository, DoctorRepository doctorRepository,
                       DoctorAvailabilityRepository availabilityRepository,
                       AppointmentRepository appointmentRepository,
                       PrescriptionRepository prescriptionRepository) {
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.availabilityRepository = availabilityRepository;
        this.appointmentRepository = appointmentRepository;
        this.prescriptionRepository = prescriptionRepository;
    }

    @Transactional(readOnly = true)
    public PatientProfile patientProfile(UUID userId) {
        Patient patient = patientFor(userId);
        return toPatientProfile(patient);
    }

    @Transactional
    public PatientProfile updatePatientProfile(UUID userId, PatientProfileUpdate update) {
        Patient patient = patientFor(userId);
        UserAccount account = patient.getUserAccount();
        if (update.fullName() != null) account.setFullName(requireNonBlank(update.fullName(), "fullName"));
        if (update.phone() != null) account.setPhone(requireNonBlank(update.phone(), "phone"));
        if (update.dateOfBirth() != null) patient.setDateOfBirth(update.dateOfBirth());
        if (update.address() != null) patient.setAddress(requireNonBlank(update.address(), "address"));
        return toPatientProfile(patient);
    }

    @Transactional(readOnly = true)
    public DoctorProfile doctorProfile(UUID userId) {
        return toDoctorProfile(doctorForUser(userId));
    }

    @Transactional(readOnly = true)
    public Page<PublicDoctorProfile> searchDoctors(String query, String specialization, Pageable pageable) {
        String safeQuery = query == null || query.isBlank() ? "" : query.trim();
        String safeSpecialization = specialization == null || specialization.isBlank()
            ? "" : specialization.trim();
        return doctorRepository.searchApproved(safeQuery, safeSpecialization, pageable)
            .map(this::toPublicDoctorProfile);
    }

    @Transactional(readOnly = true)
    public List<AvailabilityView> doctorAvailability(UUID doctorId, Instant from, Instant to) {
        requireValidRange(from, to);
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> ApiException.notFound("Doctor not found."));
        if (!doctor.isApproved()) throw ApiException.notFound("Doctor not found.");
        return availabilityRepository.findInRange(doctorId, from, to).stream()
            .map(this::toAvailabilityView)
            .toList();
    }

    @Transactional
    public AvailabilityView addAvailability(UUID userId, AvailabilityCreate request) {
        requireValidRange(request.startsAt(), request.endsAt());
        Doctor doctor = approvedDoctorForUser(userId);
        DoctorAvailability availability = availabilityRepository.save(
            new DoctorAvailability(doctor, request.startsAt(), request.endsAt())
        );
        return toAvailabilityView(availability);
    }

    @Transactional(readOnly = true)
    public List<AvailabilityView> ownAvailability(UUID userId, Instant from, Instant to) {
        requireValidRange(from, to);
        Doctor doctor = doctorForUser(userId);
        return availabilityRepository.findInRange(doctor.getId(), from, to).stream()
            .map(this::toAvailabilityView)
            .toList();
    }

    @Transactional
    public void deleteAvailability(UUID userId, UUID availabilityId) {
        Doctor doctor = approvedDoctorForUser(userId);
        DoctorAvailability availability = availabilityRepository
            .findByIdAndDoctor_Id(availabilityId, doctor.getId())
            .orElseThrow(() -> ApiException.notFound("Availability window not found."));
        if (appointmentRepository.hasActiveOverlap(
            doctor.getId(), availability.getStartsAt(), availability.getEndsAt(), AppointmentStatus.CANCELLED
        )) {
            throw ApiException.conflict("Availability with an active appointment cannot be removed.");
        }
        availabilityRepository.delete(availability);
    }

    @Transactional(readOnly = true)
    public AvailabilityResult checkAvailability(UUID doctorId, Instant startsAt, Instant endsAt) {
        if (startsAt == null || endsAt == null || startsAt.isBefore(Instant.now()) ||
            !endsAt.isAfter(startsAt)) {
            throw ApiException.badRequest("Provide a future start and an end time after the start.");
        }
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> ApiException.notFound("Doctor not found."));
        if (!doctor.isApproved()) throw ApiException.notFound("Doctor not found.");
        boolean inWindow = availabilityRepository.isWindowAvailable(doctorId, startsAt, endsAt);
        boolean booked = appointmentRepository.hasActiveOverlap(
            doctorId, startsAt, endsAt, AppointmentStatus.CANCELLED
        );
        return new AvailabilityResult(inWindow && !booked);
    }

    @Transactional
    public AppointmentView bookAppointment(UUID userId, AppointmentCreate request) {
        requireValidRange(request.startsAt(), request.endsAt());
        if (request.startsAt().isBefore(Instant.now())) {
            throw ApiException.badRequest("Appointments must be booked for a future time.");
        }
        Patient patient = patientFor(userId);
        // Locking the doctor row serializes simultaneous booking attempts for that doctor.
        Doctor doctor = doctorRepository.findByIdForUpdate(request.doctorId())
            .orElseThrow(() -> ApiException.notFound("Doctor not found."));
        if (!doctor.isApproved()) throw ApiException.notFound("Doctor not found.");
        if (!availabilityRepository.isWindowAvailable(doctor.getId(), request.startsAt(), request.endsAt())) {
            throw ApiException.conflict("The requested time is outside the doctor's available hours.");
        }
        if (appointmentRepository.hasActiveOverlap(
            doctor.getId(), request.startsAt(), request.endsAt(), AppointmentStatus.CANCELLED
        )) {
            throw ApiException.conflict("The doctor already has an appointment during that time.");
        }
        Appointment appointment = appointmentRepository.save(
            new Appointment(patient, doctor, request.startsAt(), request.endsAt())
        );
        return toAppointmentView(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentView> patientAppointments(UUID userId) {
        Patient patient = patientFor(userId);
        return appointmentRepository.findByPatient_IdOrderByStartsAtDesc(patient.getId()).stream()
            .map(this::toAppointmentView)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentView> doctorAppointments(UUID userId) {
        Doctor doctor = approvedDoctorForUser(userId);
        return appointmentRepository.findByDoctor_IdOrderByStartsAtAsc(doctor.getId()).stream()
            .map(this::toAppointmentView)
            .toList();
    }

    @Transactional(readOnly = true)
    public AppointmentView getAppointment(AuthenticatedUser user, UUID appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> ApiException.notFound("Appointment not found."));
        requireAppointmentAccess(user, appointment);
        return toAppointmentView(appointment);
    }

    @Transactional
    public AppointmentView cancelAppointment(AuthenticatedUser user, UUID appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> ApiException.notFound("Appointment not found."));
        requireAppointmentAccess(user, appointment);
        if (appointment.getStatus() != AppointmentStatus.PENDING &&
            appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw ApiException.conflict("Only pending or confirmed appointments can be cancelled.");
        }
        appointment.setStatus(AppointmentStatus.CANCELLED);
        return toAppointmentView(appointment);
    }

    @Transactional
    public AppointmentView updateAppointmentStatus(AuthenticatedUser user, UUID appointmentId,
                                                    AppointmentStatus status) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> ApiException.notFound("Appointment not found."));
        requireAppointmentAccess(user, appointment);
        AppointmentStatus current = appointment.getStatus();
        if (user.role() == Role.PATIENT && status != AppointmentStatus.CANCELLED) {
            throw ApiException.forbidden("Patients may only cancel their own appointments.");
        }
        if (status == AppointmentStatus.PENDING || current == AppointmentStatus.CANCELLED ||
            current == AppointmentStatus.COMPLETED || current == AppointmentStatus.NO_SHOW) {
            throw ApiException.conflict("The requested appointment status transition is not allowed.");
        }
        if (user.role() == Role.DOCTOR &&
            status != AppointmentStatus.CONFIRMED &&
            status != AppointmentStatus.CANCELLED &&
            status != AppointmentStatus.COMPLETED &&
            status != AppointmentStatus.NO_SHOW) {
            throw ApiException.forbidden("Doctors cannot set this appointment status.");
        }
        if (user.role() == Role.DOCTOR && status == AppointmentStatus.COMPLETED &&
            current != AppointmentStatus.CONFIRMED) {
            throw ApiException.conflict("Only confirmed appointments can be marked completed.");
        }
        if (user.role() == Role.DOCTOR && status == AppointmentStatus.NO_SHOW &&
            current != AppointmentStatus.CONFIRMED) {
            throw ApiException.conflict("Only confirmed appointments can be marked as no-show.");
        }
        appointment.setStatus(status);
        return toAppointmentView(appointment);
    }

    @Transactional
    public PrescriptionView createPrescription(UUID userId, UUID appointmentId, PrescriptionCreate request) {
        Doctor doctor = approvedDoctorForUser(userId);
        Appointment appointment = appointmentRepository.findByIdAndDoctor_Id(appointmentId, doctor.getId())
            .orElseThrow(() -> ApiException.notFound("Appointment not found."));
        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw ApiException.conflict("Prescriptions can be created after the appointment is completed.");
        }
        Prescription prescription = prescriptionRepository.save(new Prescription(
            appointment, appointment.getPatient(), doctor, request.medicationName().trim(),
            request.dosage().trim(), request.frequency().trim(), request.instructions().trim(),
            request.validUntil()
        ));
        return toPrescriptionView(prescription);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionView> patientPrescriptions(UUID userId) {
        Patient patient = patientFor(userId);
        return prescriptionRepository.findByPatient_IdOrderByIssuedAtDesc(patient.getId()).stream()
            .map(this::toPrescriptionView)
            .toList();
    }

    private void requireAppointmentAccess(AuthenticatedUser user, Appointment appointment) {
        boolean allowed = switch (user.role()) {
            case ADMIN -> true;
            case PATIENT -> patientFor(user.id()).getId().equals(appointment.getPatient().getId());
            case DOCTOR -> doctorForUser(user.id()).getId().equals(appointment.getDoctor().getId());
        };
        if (!allowed) throw ApiException.notFound("Appointment not found.");
    }

    private Patient patientFor(UUID userId) {
        return patientRepository.findByUserAccount_Id(userId)
            .orElseThrow(() -> ApiException.notFound("Patient profile not found."));
    }

    private Doctor doctorForUser(UUID userId) {
        return doctorRepository.findByUserAccount_Id(userId)
            .orElseThrow(() -> ApiException.notFound("Doctor profile not found."));
    }

    private Doctor approvedDoctorForUser(UUID userId) {
        Doctor doctor = doctorForUser(userId);
        if (!doctor.isApproved()) throw ApiException.forbidden("Your doctor account is awaiting approval.");
        return doctor;
    }

    private void requireValidRange(Instant start, Instant end) {
        if (start == null || end == null || !end.isAfter(start)) {
            throw ApiException.badRequest("The end time must be after the start time.");
        }
    }

    private String requireNonBlank(String value, String field) {
        if (value.isBlank()) throw ApiException.badRequest(field + " cannot be blank.");
        return value.trim();
    }

    private PatientProfile toPatientProfile(Patient patient) {
        UserAccount account = patient.getUserAccount();
        return new PatientProfile(patient.getId(), account.getEmail(), account.getFullName(),
            account.getPhone(), patient.getDateOfBirth(), patient.getAddress());
    }

    private DoctorProfile toDoctorProfile(Doctor doctor) {
        UserAccount account = doctor.getUserAccount();
        return new DoctorProfile(doctor.getId(), account.getEmail(), account.getFullName(),
            account.getPhone(), doctor.getLicenseNumber(), doctor.getBiography(),
            doctor.getYearsOfExperience(), doctor.getConsultationFee(), doctor.isApproved(),
            specializationNames(doctor));
    }

    private PublicDoctorProfile toPublicDoctorProfile(Doctor doctor) {
        return new PublicDoctorProfile(doctor.getId(), doctor.getUserAccount().getFullName(),
            doctor.getBiography(), doctor.getYearsOfExperience(), doctor.getConsultationFee(),
            specializationNames(doctor));
    }

    private List<String> specializationNames(Doctor doctor) {
        return doctor.getSpecializations().stream().map(Specialization::getName).sorted().toList();
    }

    private AvailabilityView toAvailabilityView(DoctorAvailability availability) {
        return new AvailabilityView(availability.getId(), availability.getDoctor().getId(),
            availability.getStartsAt(), availability.getEndsAt());
    }

    private AppointmentView toAppointmentView(Appointment appointment) {
        return new AppointmentView(
            appointment.getId(),
            appointment.getDoctor().getId(),
            appointment.getDoctor().getUserAccount().getFullName(),
            appointment.getPatient().getId(),
            appointment.getPatient().getUserAccount().getFullName(),
            appointment.getStartsAt(),
            appointment.getEndsAt(),
            appointment.getStatus()
        );
    }

    private PrescriptionView toPrescriptionView(Prescription prescription) {
        return new PrescriptionView(
            prescription.getId(),
            prescription.getAppointment().getId(),
            prescription.getDoctor().getUserAccount().getFullName(),
            prescription.getMedicationName(),
            prescription.getDosage(),
            prescription.getFrequency(),
            prescription.getInstructions(),
            prescription.getValidUntil(),
            prescription.getIssuedAt()
        );
    }
}