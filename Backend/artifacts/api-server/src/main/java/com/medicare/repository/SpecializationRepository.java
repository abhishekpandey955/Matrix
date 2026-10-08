package com.medicare.repository;

import com.medicare.domain.Specialization;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpecializationRepository extends JpaRepository<Specialization, Long> {
    List<Specialization> findByIdIn(Iterable<Long> ids);
}