package com.churninsight.backend.services;

import com.churninsight.backend.entities.PrediccionChurn;
import com.churninsight.backend.repositories.PrediccionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;//Lo missmo para el constructor
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrediccionService {

    private final PrediccionRepository prediccionRepository;
    //metodo para guardar una prediccion
    @Transactional
    public PrediccionChurn guardarPrediccion(PrediccionChurn prediccion) {
        return prediccionRepository.save(prediccion);
    }
    //metodo para obtener predicciones por cliente
    public List<PrediccionChurn> obtenerPrediccionesPorCliente(Integer clienteId) {
        return prediccionRepository.findByClienteId(clienteId);
    }
}