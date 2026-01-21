package com.churninsight.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor //  esto para inyectar el filtro
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter; // Inyectamos el filtro que creamos

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        configuration.setAllowedOrigins(java.util.List.of("*")); // Permite cualquier origen (frontend)
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(java.util.List.of("Authorization", "Content-Type"));
        configuration.setExposedHeaders(java.util.List.of("Authorization"));

        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults()) // Asegura soporte para CORS
                .authorizeHttpRequests(auth -> auth
                        // 1. RUTAS PÚBLICAS (Archivos y Auth)
                        .requestMatchers(
                                "/",
                                "/login.html",
                                "/registro.html",
                                "/loading.html",
                                "/nosotros.html",
                                "/valores.html",
                                "/dashboard.html",
                                "/favicon.ico",
                                "/css/**",
                                "/js/**",
                                "/img/**",
                                "/api/auth/login",
                                "/api/auth/register"
                        ).permitAll()

                        // 2. RUTAS PROTEGIDAS (Requieren Token)
                        .requestMatchers("/api/clientes/**").authenticated()
                        .requestMatchers("/api/auth/actualizar").authenticated()
                        .requestMatchers("/api/champion3/**").authenticated()
                        .requestMatchers("/api/predicciones/**").authenticated()

                        // 3. CUALQUIER OTRA PETICIÓN
                        .anyRequest().authenticated()
                )
                // Filtro JWT
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}