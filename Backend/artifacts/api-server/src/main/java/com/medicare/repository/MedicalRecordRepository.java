package com.medicare.repository;

import com.medicare.domain.MedicalRecord;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, UUID> {}