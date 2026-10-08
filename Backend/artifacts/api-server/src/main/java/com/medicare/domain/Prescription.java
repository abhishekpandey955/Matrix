package com.medicare.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "prescriptions")
public class Prescription {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(name = "medication_name", nullable = false, length = 200)
    private String medicationName;

    @Column(nullable = false, length = 200)
    private String dosage;

    @Column(nullable = false, length = 200)
    private String frequency;

    @Column(nullable = false, length = 2000)
    private String instructions;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(name = "issued_at", nullable = false, updatable = false)
    private Instant issuedAt = Instant.now();

    protected Prescription() {}

    public Prescription(Appointment appointment, Patient patient, Doctor doctor,
                        String medicationName, String dosage, String frequency,
                        String instructions, LocalDate validUntil) {
        this.appointment = appointment;
        this.patient = patient;
        this.doctor = doctor;
        this.medicationName = medicationName;
        this.dosage = dosage;
        this.frequency = frequency;
        this.instructions = instructions;
        this.validUntil = validUntil;
    }

    public UUID getId() { return id; }
    public Appointment getAppointment() { return appointment; }
    public Patient getPatient() { return patient; }
    public Doctor getDoctor() { return doctor; }
    public String getMedicationName() { return medicationName; }
    public String getDosage() { return dosage; }
    public String getFrequency() { return frequency; }
    public String getInstructions() { return instructions; }
    public LocalDate getValidUntil() { return validUntil; }
    public Instant getIssuedAt() { return issuedAt; }
}