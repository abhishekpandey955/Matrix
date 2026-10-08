package com.medicare.repository;

import com.medicare.domain.Appointment;
import com.medicare.domain.AppointmentStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    List<Appointment> findByPatient_IdOrderByStartsAtDesc(UUID patientId);
    List<Appointment> findByDoctor_IdOrderByStartsAtAsc(UUID doctorId);

    @Query("""
        select count(a) > 0 from Appointment a
        where a.doctor.id = :doctorId
          and a.status <> :cancelled
          and a.startsAt < :endsAt
          and a.endsAt > :startsAt
        """)
    boolean hasActiveOverlap(
        @Param("doctorId") UUID doctorId,
        @Param("startsAt") Instant startsAt,
        @Param("endsAt") Instant endsAt,
        @Param("cancelled") AppointmentStatus cancelled
    );

    Optional<Appointment> findByIdAndPatient_Id(UUID id, UUID patientId);
    Optional<Appointment> findByIdAndDoctor_Id(UUID id, UUID doctorId);
}