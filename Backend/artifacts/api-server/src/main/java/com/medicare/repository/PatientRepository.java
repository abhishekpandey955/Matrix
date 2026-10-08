package com.medicare.repository;

import com.medicare.domain.Patient;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, UUID> {
    Optional<Patient> findByUserAccount_Id(UUID userId);
}