package com.medicare.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "doctors")
public class Doctor {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserAccount userAccount;

    @Column(name = "license_number", nullable = false, unique = true, length = 100)
    private String licenseNumber;

    @Column(nullable = false, length = 2000)
    private String biography;

    @Column(name = "years_of_experience", nullable = false)
    private int yearsOfExperience;

    @Column(name = "consultation_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal consultationFee = BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean approved;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "doctor_specializations",
        joinColumns = @JoinColumn(name = "doctor_id"),
        inverseJoinColumns = @JoinColumn(name = "specialization_id")
    )
    private Set<Specialization> specializations = new HashSet<>();

    protected Doctor() {}

    public Doctor(UserAccount userAccount, String licenseNumber, String biography,
                  int yearsOfExperience, BigDecimal consultationFee,
                  Set<Specialization> specializations) {
        this.userAccount = userAccount;
        this.licenseNumber = licenseNumber;
        this.biography = biography;
        this.yearsOfExperience = yearsOfExperience;
        this.consultationFee = consultationFee;
        this.specializations = specializations;
    }

    public UUID getId() { return id; }
    public UserAccount getUserAccount() { return userAccount; }
    public String getLicenseNumber() { return licenseNumber; }
    public String getBiography() { return biography; }
    public int getYearsOfExperience() { return yearsOfExperience; }
    public BigDecimal getConsultationFee() { return consultationFee; }
    public boolean isApproved() { return approved; }
    public Set<Specialization> getSpecializations() { return specializations; }
    public void setApproved(boolean approved) { this.approved = approved; }
}