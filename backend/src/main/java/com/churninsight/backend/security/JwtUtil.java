package com.churninsight.backend.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // Esta es la "Llave Maestra" fija. En un entorno real iría en un archivo .properties
    // Debe tener al menos 32 caracteres para ser segura con HS256
    private static final String SECRET_KEY_STRING = "EstaEsMiLlaveSecretaSuperLargaYSeguraParaElProyecto2025";

    private final Key key = Keys.hmacShaKeyFor(SECRET_KEY_STRING.getBytes(StandardCharsets.UTF_8));
    private final long expirationTime = 3600000; // 1 hora PARA EL TOKEN

    public String generarToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(key)
                .compact();
    }
    // Extrae el username (subject) del token JWT
    public String extraerUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
}