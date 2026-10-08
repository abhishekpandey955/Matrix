package com.medicare.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicare.dto.ApiDtos.ApiError;
import com.medicare.repository.UserAccountRepository;
import com.medicare.security.JwtAuthFilter;
import com.medicare.security.JwtService;
import jakarta.servlet.Filter;
import java.time.Instant;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    JwtAuthFilter jwtAuthFilter(JwtService jwtService, UserAccountRepository userRepository) {
        return new JwtAuthFilter(jwtService, userRepository);
    }

    @Bean
    FilterRegistrationBean<JwtAuthFilter> disableServletRegistration(JwtAuthFilter filter) {
        FilterRegistrationBean<JwtAuthFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
        @Value("${medicare.cors.allowed-origins}") String origins
    ) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(origins.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isEmpty())
            .toList());
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        configuration.setExposedHeaders(ListHolder.EXPOSED_HEADERS);
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter,
                                            ObjectMapper objectMapper) throws Exception {
        AuthenticationEntryPoint unauthorized = (request, response, exception) -> {
            response.setStatus(401);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getOutputStream(),
                new ApiError("UNAUTHENTICATED", "A valid bearer token is required.",
                    Instant.now(), request.getRequestURI()));
        };
        AccessDeniedHandler forbidden = (request, response, exception) -> {
            response.setStatus(403);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getOutputStream(),
                new ApiError("FORBIDDEN", "You do not have permission to access this resource.",
                    Instant.now(), request.getRequestURI()));
        };

        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint(unauthorized)
                .accessDeniedHandler(forbidden))
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/healthz", "/auth/**", "/swagger-ui/**", "/swagger-ui.html",
                    "/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/doctors/search", "/doctors/*/availability",
                    "/appointments/availability").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers("/patients/**").hasRole("PATIENT")
                .anyRequest().authenticated())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private static final class ListHolder {
        private static final java.util.List<String> EXPOSED_HEADERS = java.util.List.of("Location");
    }
}