package com.medicare.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "doctor_availability")
public class DoctorAvailability {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    protected DoctorAvailability() {}

    public DoctorAvailability(Doctor doctor, Instant startsAt, Instant endsAt) {
        this.doctor = doctor;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
    }

    public UUID getId() { return id; }
    public Doctor getDoctor() { return doctor; }
    public Instant getStartsAt() { return startsAt; }
    public Instant getEndsAt() { return endsAt; }
}