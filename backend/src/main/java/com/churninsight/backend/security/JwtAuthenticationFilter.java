package com.churninsight.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component // Indica que es un componente gestionado por Spring
@RequiredArgsConstructor//esto genera el constructor con los atributos finales
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    // Inyectamos la clase utilitaria para manejar JWT
    private final JwtUtil jwtUtil;

    @Override
    // Método que se ejecuta una vez por cada petición al servidor
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. Extraer el encabezado "Authorization"
        String authHeader = request.getHeader("Authorization");
        // Comprobar que el encabezado contiene un token Bearer
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            // 2. Si hay usuario y no está ya autenticado en esta petición
            // Cambia esta parte en JwtAuthenticationFilter.java
            try {
                String token = authHeader.substring(7);
                String username = jwtUtil.extraerUsername(token);
                // SI hay un usuario y no está ya autenticado
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                    // 3. Crear la autenticación para Spring
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            username, null, new ArrayList<>()
                    );
                    // Detalles adicionales de la petición
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // 4. "Abrir la puerta": Guardar la autenticación en el contexto
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (Exception e) {
                // Si el token falla, simplemente no autenticamos, no lanzamos error 500
                System.out.println("Error validando JWT: " + e.getMessage());
            }

        }

        // 5. Continuar con la petición
        filterChain.doFilter(request, response);
    }
}