package com.churninsight.backend.controllers;

import com.churninsight.backend.dto.PrediccionResponseDTO;
import com.churninsight.backend.entities.PrediccionChurn;
import com.churninsight.backend.services.PrediccionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/predicciones")// Endpoint para gestionar las predicciones de churn
@RequiredArgsConstructor
public class PrediccionController {

    private final PrediccionService prediccionService;

    @PostMapping("/guardar")
    public ResponseEntity<PrediccionChurn> guardarResultado(@RequestBody PrediccionChurn prediccion) {
        return ResponseEntity.ok(prediccionService.guardarPrediccion(prediccion));
    }
}