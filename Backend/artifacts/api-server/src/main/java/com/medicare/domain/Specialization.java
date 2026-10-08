package com.medicare.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "specializations")
public class Specialization {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    protected Specialization() {}

    public Long getId() { return id; }
    public String getName() { return name; }
}