package com.medicare.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.medicare.domain.Role;
import com.medicare.domain.UserAccount;
import com.medicare.repository.UserAccountRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AdminBootstrapTest {
    @Mock
    private UserAccountRepository userRepository;

    @Test
    void disabledBootstrapDoesNotReadOrWriteAccounts() throws Exception {
        AdminBootstrap bootstrap = new AdminBootstrap(userRepository, mock(PasswordEncoder.class),
            false, "", "");

        bootstrap.run(new DefaultApplicationArguments());

        verifyNoInteractions(userRepository);
    }

    @Test
    void createsNormalizedAdminWithBCryptPasswordAndAdminRole() throws Exception {
        PasswordEncoder encoder = new BCryptPasswordEncoder(4);
        when(userRepository.findByEmailIgnoreCase("admin@example.test")).thenReturn(Optional.empty());
        AdminBootstrap bootstrap = new AdminBootstrap(userRepository, encoder,
            true, " Admin@Example.Test ", "test-admin-password-123");

        bootstrap.run(new DefaultApplicationArguments());

        ArgumentCaptor<UserAccount> captor = ArgumentCaptor.forClass(UserAccount.class);
        verify(userRepository).saveAndFlush(captor.capture());
        UserAccount saved = captor.getValue();
        assertEquals("admin@example.test", saved.getEmail());
        assertEquals(Role.ADMIN, saved.getRole());
        assertNotEquals("test-admin-password-123", saved.getPasswordHash());
        assertTrue(encoder.matches("test-admin-password-123", saved.getPasswordHash()));
    }

    @Test
    void existingNonAdminAccountIsNotPromotedOrChanged() throws Exception {
        UserAccount existingPatient = new UserAccount(
            "admin@example.test", "existing-password-hash", Role.PATIENT, "Existing Patient", "555-0100"
        );
        when(userRepository.findByEmailIgnoreCase("admin@example.test"))
            .thenReturn(Optional.of(existingPatient));
        AdminBootstrap bootstrap = new AdminBootstrap(userRepository, mock(PasswordEncoder.class),
            true, "admin@example.test", "test-admin-password-123");

        bootstrap.run(new DefaultApplicationArguments());

        verify(userRepository, never()).saveAndFlush(any(UserAccount.class));
        assertEquals(Role.PATIENT, existingPatient.getRole());
        assertEquals("existing-password-hash", existingPatient.getPasswordHash());
    }

    @Test
    void existingAdminWithMatchingPasswordIsReusedWithoutChangingItsHash() throws Exception {
        PasswordEncoder encoder = new BCryptPasswordEncoder(4);
        String existingHash = encoder.encode("test-admin-password-123");
        UserAccount existingAdmin = new UserAccount(
            "admin@example.test", existingHash, Role.ADMIN, "System Administrator", "Not provided"
        );
        when(userRepository.findByEmailIgnoreCase("admin@example.test"))
            .thenReturn(Optional.of(existingAdmin));
        AdminBootstrap bootstrap = new AdminBootstrap(userRepository, encoder,
            true, "admin@example.test", "test-admin-password-123");

        bootstrap.run(new DefaultApplicationArguments());

        verify(userRepository, never()).saveAndFlush(any(UserAccount.class));
        assertEquals(existingHash, existingAdmin.getPasswordHash());
    }

    @Test
    void existingAdminWithDifferentPasswordIsNotOverwritten() throws Exception {
        PasswordEncoder encoder = new BCryptPasswordEncoder(4);
        String existingHash = encoder.encode("existing-admin-password-123");
        UserAccount existingAdmin = new UserAccount(
            "admin@example.test", existingHash, Role.ADMIN, "System Administrator", "Not provided"
        );
        when(userRepository.findByEmailIgnoreCase("admin@example.test"))
            .thenReturn(Optional.of(existingAdmin));
        AdminBootstrap bootstrap = new AdminBootstrap(userRepository, encoder,
            true, "admin@example.test", "test-admin-password-123");

        bootstrap.run(new DefaultApplicationArguments());

        verify(userRepository, never()).saveAndFlush(any(UserAccount.class));
        assertEquals(existingHash, existingAdmin.getPasswordHash());
        assertTrue(encoder.matches("existing-admin-password-123", existingAdmin.getPasswordHash()));
        assertFalse(encoder.matches("test-admin-password-123", existingAdmin.getPasswordHash()));
    }

    @Test
    void existingAdminWithAnotherEmailPreventsCreatingASecondAdmin() throws Exception {
        when(userRepository.findByEmailIgnoreCase("admin@example.test")).thenReturn(Optional.empty());
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(1L);
        AdminBootstrap bootstrap = new AdminBootstrap(userRepository, mock(PasswordEncoder.class),
            true, "admin@example.test", "test-admin-password-123");

        bootstrap.run(new DefaultApplicationArguments());

        verify(userRepository, never()).saveAndFlush(any(UserAccount.class));
    }

    @Test
    void concurrentBootstrapInsertIsHandledAsAlreadyExisting() throws Exception {
        PasswordEncoder encoder = new BCryptPasswordEncoder(4);
        String existingHash = encoder.encode("test-admin-password-123");
        UserAccount concurrentlyCreated = new UserAccount(
            "admin@example.test", existingHash, Role.ADMIN, "System Administrator", "Not provided"
        );
        when(userRepository.findByEmailIgnoreCase("admin@example.test"))
            .thenReturn(Optional.empty(), Optional.of(concurrentlyCreated));
        when(userRepository.saveAndFlush(any(UserAccount.class)))
            .thenThrow(new DataIntegrityViolationException("duplicate email"));
        AdminBootstrap bootstrap = new AdminBootstrap(userRepository, encoder,
            true, "admin@example.test", "test-admin-password-123");

        assertDoesNotThrow(() -> bootstrap.run(new DefaultApplicationArguments()));

        verify(userRepository).saveAndFlush(any(UserAccount.class));
        assertEquals(Role.ADMIN, concurrentlyCreated.getRole());
        assertEquals(existingHash, concurrentlyCreated.getPasswordHash());
    }

    @Test
    void enabledBootstrapRejectsMissingOrWeakConfigurationWithoutWriting() {
        AdminBootstrap bootstrap = new AdminBootstrap(userRepository, mock(PasswordEncoder.class),
            true, "not-an-email", "short");

        assertThrows(IllegalStateException.class,
            () -> bootstrap.run(new DefaultApplicationArguments()));

        verifyNoInteractions(userRepository);
    }
}