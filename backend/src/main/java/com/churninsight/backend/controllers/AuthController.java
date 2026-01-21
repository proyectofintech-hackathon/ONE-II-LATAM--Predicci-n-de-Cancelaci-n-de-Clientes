package com.churninsight.backend.controllers;

import com.churninsight.backend.entities.Usuario;
import com.churninsight.backend.repositories.UsuarioRepository;
import com.churninsight.backend.security.JwtUtil;
import com.churninsight.backend.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication; // IMPORTANTE PARA OBTENER EL USUARIO AUTENTICADO
import org.springframework.security.crypto.password.PasswordEncoder; // IMPORTANTE PARA ENCRIPTAR
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository; // Inyectamos el repositorio
    private final PasswordEncoder passwordEncoder;     // Inyectamos el encriptador

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (authService.validarCredenciales(username, password)) {
            String token = jwtUtil.generarToken(username);
            return ResponseEntity.ok(Map.of(
                    "message", "Login exitoso",
                    "token", token
            ));
        } else {
            return ResponseEntity.status(401).body(Map.of("error", "Usuario o contraseña incorrectos"));
        }
    }
    // --- ruta para el reGISTRO ---

    @PostMapping("/register")
    public ResponseEntity<?> registrarUsuario(@RequestBody Map<String, String> datos) {
        String username = datos.get("username");
        String password = datos.get("password");
        String roleStr = datos.get("role"); // Recibimos el string del rol (ej: "ADMIN")

        if (username == null || password == null || username.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Usuario y contraseña son obligatorios"));
        }

        if (usuarioRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre de usuario ya existe"));
        }

        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setUsername(username);
        nuevoUsuario.setPassword(passwordEncoder.encode(password));

        // ---  Asignar el Rol ---
        try {
            if (roleStr != null && !roleStr.isEmpty()) {
                // Convertimos el String del frontend al Enum (ADMIN o CONSULTOR)
                nuevoUsuario.setRol(com.churninsight.backend.enums.Rol.valueOf(roleStr.toUpperCase()));
            } else {
                // Rol por defecto si el usuario no elige
                nuevoUsuario.setRol(com.churninsight.backend.enums.Rol.CONSULTOR);
            }
        } catch (IllegalArgumentException e) {
            // Si mandan un texto que no existe en el Enum, ponemos CONSULTOR
            nuevoUsuario.setRol(com.churninsight.backend.enums.Rol.CONSULTOR);
        }

        usuarioRepository.save(nuevoUsuario);

        return ResponseEntity.ok(Map.of("message", "Usuario registrado exitosamente"));
    }
    // Cambié la ruta a /actualizar ya que el prefijo del controlador es /api/auth
    // Por lo tanto, la URL final será: PUT /api/auth/actualizar
    @PutMapping("/actualizar")
    public ResponseEntity<?> actualizarPerfil(@RequestBody Map<String, String> datos, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(403).body(Map.of("error", "No autenticado"));
        }

        String usernameActual = authentication.getName();
        String nuevoNombre = datos.get("nuevoNombre");
        String nuevaPassword = datos.get("nuevaPassword");

        // Buscamos al usuario en la BD usando el nombre del token

        Usuario usuario = usuarioRepository.findByUsername(usernameActual)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Actualizar nombre si se envió
        if (nuevoNombre != null && !nuevoNombre.isEmpty()) {
            usuario.setUsername(nuevoNombre);
        }

        // Actualizar contraseña si se envió (encriptándola primero)
        if (nuevaPassword != null && !nuevaPassword.isEmpty()) {
            usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        }

        usuarioRepository.save(usuario);

        return ResponseEntity.ok(Map.of(
                "message", "Perfil actualizado con éxito. Por seguridad, inicia sesión de nuevo."
        ));
    }
}