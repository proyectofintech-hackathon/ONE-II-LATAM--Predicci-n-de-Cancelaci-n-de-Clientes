package com.churninsight.backend.config;

import com.churninsight.backend.entities.Usuario;
import com.churninsight.backend.enums.Rol;
import com.churninsight.backend.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Verificamos si ya existe un usuario administrador
        if (usuarioRepository.count() == 0) {
            Usuario admin = new Usuario();
            admin.setUsername("admin");
            // lo utilizamos para encriptar la contraseña
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRol(Rol.ADMIN);
            usuarioRepository.save(admin);
            System.out.println("Usuario administrador creado por defecto: admin/admin123");
        }
    }
}