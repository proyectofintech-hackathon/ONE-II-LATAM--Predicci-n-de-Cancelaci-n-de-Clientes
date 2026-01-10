package com.churninsight.backend.services;

import com.churninsight.backend.entities.Usuario;
import com.churninsight.backend.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository; // repositorio para acceder a los datos de usuario
    private final PasswordEncoder passwordEncoder; // variable para encriptar y comparar contraseñas

    public boolean validarCredenciales(String username, String password) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(username);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            // password: la que viene del login
            // usuario.getPassword(): la que está en la BD
            return passwordEncoder.matches(password, usuario.getPassword());
        }
        return false;
    }
}