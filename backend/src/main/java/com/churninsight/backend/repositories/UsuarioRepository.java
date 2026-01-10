package com.churninsight.backend.repositories;

import com.churninsight.backend.entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // Método  para el Login: busca al usuario por su nombre aun que se piuede modificar para buscar por email o etc
    Optional<Usuario> findByUsername(String username);
}