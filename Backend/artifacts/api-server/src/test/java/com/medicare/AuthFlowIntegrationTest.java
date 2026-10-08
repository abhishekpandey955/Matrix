package com.medicare;

import static org.junit.jupiter.api.Assertions.*;

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
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "spring.datasource.url=jdbc:h2:mem:medicare-test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "medicare.admin-bootstrap.enabled=false",
        "medicare.admin-bootstrap.email=",
        "medicare.admin-bootstrap.password="
    }
)
@ActiveProfiles("test")
class AuthFlowIntegrationTest {
    @Autowired
    private TestRestTemplate client;

    @Test
    void patientCanRegisterLoginAndReadOnlyTheirSafeProfileDto() {
        String email = "patient-" + System.nanoTime() + "@example.test";
        Map<String, Object> registration = Map.of(
            "email", email,
            "password", "test-only-strong-password",
            "fullName", "Test Patient",
            "phone", "555-0100",
            "dateOfBirth", "1990-01-01",
            "address", "Test address"
        );

        ResponseEntity<Map> registered = client.postForEntity(
            "/auth/register/patient", new HttpEntity<>(registration), Map.class);
        assertEquals(HttpStatus.CREATED, registered.getStatusCode(),
            registered.getBody() == null ? "<empty response>" : registered.getBody().toString());
        assertEquals("PATIENT", registered.getBody().get("role"));
        String registrationToken = (String) registered.getBody().get("accessToken");
        assertNotNull(registrationToken);

        HttpHeaders authenticatedHeaders = new HttpHeaders();
        authenticatedHeaders.setBearerAuth(registrationToken);
        ResponseEntity<Map> profile = client.exchange(
            "/patients/me", HttpMethod.GET, new HttpEntity<>(authenticatedHeaders), Map.class);
        assertEquals(HttpStatus.OK, profile.getStatusCode());
        assertEquals(email, profile.getBody().get("email"));
        assertEquals("Test Patient", profile.getBody().get("fullName"));
        assertFalse(profile.getBody().containsKey("password"));
        assertFalse(profile.getBody().containsKey("passwordHash"));

        ResponseEntity<Map> login = client.postForEntity(
            "/auth/login",
            new HttpEntity<>(Map.of("email", email, "password", "test-only-strong-password")),
            Map.class
        );
        assertEquals(HttpStatus.OK, login.getStatusCode());
        assertNotNull(login.getBody().get("accessToken"));
    }

    @Test
    void patientProfileRequiresAuthentication() {
        ResponseEntity<Map> response = client.getForEntity("/patients/me", Map.class);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void publicDoctorSearchWorksWithOptionalFilters() {
        assertDoctorSearchSucceeds("/doctors/search");
        assertDoctorSearchSucceeds("/doctors/search?q=cardio");
        assertDoctorSearchSucceeds("/doctors/search?specialization=cardiology");
        assertDoctorSearchSucceeds("/doctors/search?q=cardio&specialization=cardiology");
    }

    private void assertDoctorSearchSucceeds(String path) {
        ResponseEntity<Map> response = client.getForEntity(path, Map.class);
        assertEquals(HttpStatus.OK, response.getStatusCode(),
            response.getBody() == null ? "<empty response>" : response.getBody().toString());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().containsKey("content"));
    }
}