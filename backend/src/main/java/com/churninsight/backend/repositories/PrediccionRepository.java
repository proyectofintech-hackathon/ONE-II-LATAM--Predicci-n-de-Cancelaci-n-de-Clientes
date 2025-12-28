package com.churninsight.backend.repositories;

import com.churninsight.backend.entities.PrediccionChurn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrediccionRepository extends JpaRepository<PrediccionChurn, Long> {
    // Eesto nosva a servir pra predicciones de un cliente específico
    List<PrediccionChurn> findByClienteId(Integer clienteId);
}