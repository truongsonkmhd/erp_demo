package com.xxxx.ddd.controller.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfiguration {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfiguration(JwtAuthenticationFilter jwtAuthenticationFilter, ObjectMapper objectMapper) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/authenticate/me", "/api/menus/me").authenticated()
                        .requestMatchers(
                                "/api/authenticate",
                                "/api/authenticate/refresh-token",
                                "/api/authenticate/login-with-token",
                                "/api/authenticate/logout",
                                "/api/authenticate/register",
                                "/api/authenticate/register/units"
                        ).permitAll()
                        .requestMatchers("/error").permitAll()
                        // Directory and positions are for every signed-in user; assignees carry @PreAuthorize plus a scope check.
                        .requestMatchers(HttpMethod.GET, "/api/org/**").authenticated()
                        .requestMatchers("/api/audit-logs", "/api/audit-logs/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/users", "/api/users/**").hasAnyAuthority("ROLE_ADMIN", "users:access")
                        .requestMatchers(HttpMethod.GET, "/api/roles", "/api/roles/**").hasAnyAuthority("ROLE_ADMIN", "roles:access", "users:access")
                        .requestMatchers(HttpMethod.GET, "/api/departments", "/api/departments/**").hasAnyAuthority("ROLE_ADMIN", "roles:access", "users:access")
                        .requestMatchers(HttpMethod.POST, "/api/departments").hasAnyAuthority("ROLE_ADMIN", "roles:create")
                        .requestMatchers(HttpMethod.DELETE, "/api/departments/**").hasAnyAuthority("ROLE_ADMIN", "roles:delete")
                        .requestMatchers("/api/departments/**").hasAnyAuthority("ROLE_ADMIN", "roles:update")
                        .requestMatchers(HttpMethod.POST, "/api/users").hasAnyAuthority("ROLE_ADMIN", "users:create")
                        .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasAnyAuthority("ROLE_ADMIN", "users:delete")
                        .requestMatchers("/api/users/**").hasAnyAuthority("ROLE_ADMIN", "users:update")
                        .requestMatchers(HttpMethod.GET, "/api/roles", "/api/roles/**", "/api/permissions", "/api/permissions/**", "/api/pages", "/api/actions").hasAnyAuthority("ROLE_ADMIN", "roles:access")
                        .requestMatchers(HttpMethod.POST, "/api/roles", "/api/permissions").hasAnyAuthority("ROLE_ADMIN", "roles:create")
                        .requestMatchers(HttpMethod.DELETE, "/api/roles/**", "/api/permissions/**").hasAnyAuthority("ROLE_ADMIN", "roles:delete")
                        .requestMatchers("/api/roles/**", "/api/permissions/**").hasAnyAuthority("ROLE_ADMIN", "roles:update")
                        // WebSocket handshake carries no Authorization header; STOMP CONNECT is authenticated (StompAuthInterceptor).
                        .requestMatchers("/ws", "/ws/**").permitAll()
                        .requestMatchers("/api/vldc/**").authenticated()
                        .requestMatchers("/actuator/**").permitAll()
                        // Deny by default: a new endpoint must be signed in, and declares its permission with @PreAuthorize.
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler())
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) ->
                write(response, HttpServletResponse.SC_UNAUTHORIZED, ResultUtil.error(401, "Unauthorized"));
    }

    private AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) ->
                write(response, HttpServletResponse.SC_FORBIDDEN, ResultUtil.error(403, "Forbidden"));
    }

    private void write(HttpServletResponse response, int status, ResultMessage<?> body) throws java.io.IOException {
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), body);
    }
}
