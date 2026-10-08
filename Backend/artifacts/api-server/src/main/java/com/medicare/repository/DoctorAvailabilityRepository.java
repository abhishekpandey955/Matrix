package com.medicare.repository;

import com.medicare.domain.DoctorAvailability;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, UUID> {
    @Query("""
        select a from DoctorAvailability a
        where a.doctor.id = :doctorId
          and a.startsAt < :rangeEnd
          and a.endsAt > :rangeStart
        order by a.startsAt
        """)
    List<DoctorAvailability> findInRange(
        @Param("doctorId") UUID doctorId,
        @Param("rangeStart") Instant rangeStart,
        @Param("rangeEnd") Instant rangeEnd
    );

    Optional<DoctorAvailability> findByIdAndDoctor_Id(UUID id, UUID doctorId);

    @Query("""
        select count(a) > 0 from DoctorAvailability a
        where a.doctor.id = :doctorId
          and a.startsAt <= :startsAt
          and a.endsAt >= :endsAt
        """)
    boolean isWindowAvailable(
        @Param("doctorId") UUID doctorId,
        @Param("startsAt") Instant startsAt,
        @Param("endsAt") Instant endsAt
    );
}