package com.churninsight.backend.controllers;

import com.churninsight.backend.entities.PrediccionChurn;
import com.churninsight.backend.services.PrediccionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
//direccion base para las predicciones
@RequestMapping("/api/predicciones")//Ruta base para las predicciones
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PrediccionController {

    private final PrediccionService prediccionService;
// Endpoint para guardar una nueva predicción
    @PostMapping("/guardar")
    public ResponseEntity<PrediccionChurn> guardarResultado(@RequestBody PrediccionChurn prediccion) {
        return ResponseEntity.ok(prediccionService.guardarPrediccion(prediccion));
    }


    // Endpoint para buscar las predicciones de un cliente específico
    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<PrediccionChurn>> obtenerPorCliente(@PathVariable Integer clienteId) {
        return ResponseEntity.ok(prediccionService.obtenerPrediccionesPorCliente(clienteId));
    }
}