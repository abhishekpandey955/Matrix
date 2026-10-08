package com.medicare.security;

import com.medicare.domain.Role;
import java.util.UUID;

public record AuthenticatedUser(UUID id, String email, Role role) {}