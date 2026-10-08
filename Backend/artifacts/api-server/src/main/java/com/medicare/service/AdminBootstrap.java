
package com.medicare.service;

import com.medicare.domain.Role;
import com.medicare.domain.UserAccount;
import com.medicare.repository.UserAccountRepository;

import java.util.Locale;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(AdminBootstrap.class);

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private static final int MIN_PASSWORD_LENGTH = 12;
    private static final int MAX_PASSWORD_LENGTH = 128;

    private final UserAccountRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;
    private final String email;
    private final String password;

    public AdminBootstrap(
            UserAccountRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${medicare.admin-bootstrap.enabled:false}") boolean enabled,
            @Value("${medicare.admin-bootstrap.email:}") String email,
            @Value("${medicare.admin-bootstrap.password:}") String password
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments arguments) {

        LOGGER.info(
                "Admin bootstrap component started. enabled={}",
                enabled
        );

        if (!enabled) {
            LOGGER.warn(
                    "Admin bootstrap is disabled. Check production configuration."
            );
            return;
        }

        if (!isValidEmail(email) || !isValidPassword(password)) {
            throw new IllegalStateException(
                    "Admin bootstrap configuration is invalid. "
                    + "Set MEDICARE_ADMIN_BOOTSTRAP_EMAIL and a "
                    + "MEDICARE_ADMIN_BOOTSTRAP_PASSWORD between 12 and 128 characters."
            );
        }

        String normalizedEmail =
                email.trim().toLowerCase(Locale.ROOT);

        UserAccount existingAccount =
                userRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        if (existingAccount != null) {
            reportExistingAccount(existingAccount);
            return;
        }

        if (userRepository.countByRole(Role.ADMIN) > 0) {
            LOGGER.error(
                    "Admin bootstrap skipped: an ADMIN account already exists with another email; "
                            + "no second administrator was created or changed."
            );
            return;
        }

        UserAccount admin = new UserAccount(
                normalizedEmail,
                passwordEncoder.encode(password),
                Role.ADMIN,
                "System Administrator",
                "Not provided"
        );

        try {
            userRepository.saveAndFlush(admin);

            LOGGER.info(
                    "Admin bootstrap created the configured administrator account."
            );

        } catch (DataIntegrityViolationException exception) {

            UserAccount concurrentAccount =
                    userRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
            if (concurrentAccount == null) {
                throw exception;
            }

            reportExistingAccount(concurrentAccount);
        }
    }

    private boolean isValidEmail(String value) {

        return value != null
                && value.trim().length() <= 320
                && EMAIL_PATTERN.matcher(value.trim()).matches();
    }

    private boolean isValidPassword(String value) {

        return value != null
                && !value.isBlank()
                && value.length() >= MIN_PASSWORD_LENGTH
                && value.length() <= MAX_PASSWORD_LENGTH;
    }

    private void reportExistingAccount(UserAccount existingAccount) {
        if (existingAccount.getRole() == Role.ADMIN) {
            if (passwordEncoder.matches(password, existingAccount.getPasswordHash())) {
                LOGGER.info(
                        "Admin bootstrap skipped: the configured ADMIN account exists and the configured password matches; no changes were made."
                );
            } else {
                LOGGER.error(
                        "Admin bootstrap skipped: the configured ADMIN account exists, but the configured password does not match; no changes were made."
                );
            }
            return;
        }

        LOGGER.error(
                "Admin bootstrap skipped: an existing {} account uses the configured email. "
                        + "It was not promoted or changed; resolve the role conflict explicitly.",
                existingAccount.getRole()
        );
    }
}