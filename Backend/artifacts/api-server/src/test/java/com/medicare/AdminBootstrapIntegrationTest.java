package com.medicare;

import static org.junit.jupiter.api.Assertions.*;

import com.medicare.domain.Role;
import com.medicare.repository.UserAccountRepository;
import com.medicare.security.JwtService;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "spring.datasource.url=jdbc:h2:mem:medicare-admin-bootstrap;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "medicare.admin-bootstrap.enabled=true",
        "medicare.admin-bootstrap.email=bootstrap-admin@example.test",
        "medicare.admin-bootstrap.password=test-only-admin-password-123"
    }
)
@ActiveProfiles("test")
class AdminBootstrapIntegrationTest {
    private static final String ADMIN_EMAIL = "bootstrap-admin@example.test";
    private static final String ADMIN_PASSWORD = "test-only-admin-password-123";

    @Autowired
    private UserAccountRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private TestRestTemplate client;

    @Test
    void bootstrappedAdminCanLogInAndAccessAdminApi() {
        var account = userRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        assertEquals(Role.ADMIN, account.getRole());
        assertNotEquals(ADMIN_PASSWORD, account.getPasswordHash());
        assertTrue(passwordEncoder.matches(ADMIN_PASSWORD, account.getPasswordHash()));

        ResponseEntity<Map> login = client.postForEntity(
            "/auth/login",
            new HttpEntity<>(Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD)),
            Map.class
        );

        assertEquals(HttpStatus.OK, login.getStatusCode());
        assertEquals("ADMIN", login.getBody().get("role"));
        String token = (String) login.getBody().get("accessToken");
        assertNotNull(token);
        assertEquals("ADMIN", jwtService.parse(token).get("role", String.class));

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        ResponseEntity<Map> statistics = client.exchange(
            "/admin/statistics", HttpMethod.GET, new HttpEntity<>(headers), Map.class
        );
        assertEquals(HttpStatus.OK, statistics.getStatusCode());
    }

    @Test
    void incorrectAndUnknownCredentialsHaveTheSameGenericFailure() {
        ResponseEntity<Map> wrongPassword = client.postForEntity(
            "/auth/login",
            new HttpEntity<>(Map.of("email", ADMIN_EMAIL, "password", "incorrect-test-password")),
            Map.class
        );
        ResponseEntity<Map> unknownEmail = client.postForEntity(
            "/auth/login",
            new HttpEntity<>(Map.of("email", "unknown@example.test", "password", "incorrect-test-password")),
            Map.class
        );

        assertEquals(HttpStatus.UNAUTHORIZED, wrongPassword.getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, unknownEmail.getStatusCode());
        assertEquals(wrongPassword.getBody().get("message"), unknownEmail.getBody().get("message"));
        assertEquals("Email or password is incorrect.", wrongPassword.getBody().get("message"));
    }

    @Test
    void adminApiRejectsAnonymousAndPatientAccounts() {
        ResponseEntity<Map> anonymous = client.getForEntity("/admin/statistics", Map.class);
        assertEquals(HttpStatus.UNAUTHORIZED, anonymous.getStatusCode());

        ResponseEntity<Map> registration = client.postForEntity(
            "/auth/register/patient",
            new HttpEntity<>(Map.of(
                "email", "non-admin-test@example.test",
                "password", "test-patient-password-123",
                "fullName", "Non-admin Test Patient",
                "phone", "5551234567",
                "dateOfBirth", "1990-01-01",
                "address", "Test address"
            )),
            Map.class
        );
        assertEquals(HttpStatus.CREATED, registration.getStatusCode());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth((String) registration.getBody().get("accessToken"));
        ResponseEntity<Map> patientRequest = client.exchange(
            "/admin/statistics", HttpMethod.GET, new HttpEntity<>(headers), Map.class
        );
        assertEquals(HttpStatus.FORBIDDEN, patientRequest.getStatusCode());
    }

    @Test
    void malformedLoginRequestIsRejected() {
        ResponseEntity<Map> response = client.postForEntity(
            "/auth/login",
            new HttpEntity<>(Map.of("email", "not-an-email", "password", "password")),
            Map.class
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }
}