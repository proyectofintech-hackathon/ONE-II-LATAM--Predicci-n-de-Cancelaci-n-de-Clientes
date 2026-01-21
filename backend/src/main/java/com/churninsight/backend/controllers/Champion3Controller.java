package com.churninsight.backend.controllers;

import com.churninsight.backend.entities.Cliente;
import com.churninsight.backend.entities.PrediccionChurn;
import com.churninsight.backend.services.ClienteService;
import com.churninsight.backend.services.PrediccionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/champion3")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class Champion3Controller {

    private final ClienteService clienteService;
    private final PrediccionService prediccionService; // Inyectamos el servicio de predicciones

    @PostMapping("/predecir/{id}")
    public ResponseEntity<?> predecirConChampion3(@PathVariable Integer id, @RequestBody Map<String, Object> datosManuales) {

        return clienteService.buscarPorId(id).map(cliente -> {
            // 1. Llamada a Python
            String pythonUrl = "http://ia-service:5000/api/champion3/predecir/" + id;
            RestTemplate restTemplate = new RestTemplate();

            try {
                Map<String, Object> responsePython = restTemplate.postForObject(pythonUrl, datosManuales, Map.class);

                // 2. GUARDAR EN LA TABLA DE PREDICCIONES (predicciones_churn)
                // Extraemos la probabilidad que devuelve Python
                Double probabilidad = Double.valueOf(responsePython.get("probabilidad").toString());

                PrediccionChurn nuevaPrediccion = new PrediccionChurn();
                nuevaPrediccion.setCliente(cliente); // Relacionamos con el cliente original
                nuevaPrediccion.setProbabilidad(BigDecimal.valueOf(probabilidad));
                nuevaPrediccion.setPrediccion(probabilidad > 50); // Ejemplo: true si es > 50%
                nuevaPrediccion.setFechaPrediccion(LocalDateTime.now());

                prediccionService.guardarPrediccion(nuevaPrediccion);

                // Devolvemos la respuesta de Python al Front-end
                return ResponseEntity.ok(responsePython);

            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("error", "Error en Champion 3", "details", e.getMessage()));
            }
        }).orElse(ResponseEntity.status(404).body(Map.of("error", "Cliente no encontrado")));
    }
}