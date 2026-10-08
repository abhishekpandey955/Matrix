package com.medicare.repository;

import com.medicare.domain.Doctor;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DoctorRepository extends JpaRepository<Doctor, UUID> {
    Optional<Doctor> findByUserAccount_Id(UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Doctor d where d.id = :id")
    Optional<Doctor> findByIdForUpdate(@Param("id") UUID id);

    @Query("""
        select d from Doctor d
        join d.userAccount u
        where d.approved = true
          and (:query = '' or lower(u.fullName) like lower(concat('%', :query, '%'))
               or exists (
                   select 1 from Doctor queryDoctor
                   join queryDoctor.specializations querySpecialization
                   where queryDoctor = d
                     and lower(querySpecialization.name) like lower(concat('%', :query, '%'))
               ))
          and (:specialization = '' or exists (
               select 1 from Doctor specializationDoctor
               join specializationDoctor.specializations specialization
               where specializationDoctor = d
                 and lower(specialization.name) = lower(:specialization)
          ))
        """)
    Page<Doctor> searchApproved(
        @Param("query") String query,
        @Param("specialization") String specialization,
        Pageable pageable
    );
}