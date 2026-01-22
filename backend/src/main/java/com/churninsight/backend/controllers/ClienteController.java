package com.churninsight.backend.controllers;
import com.churninsight.backend.dto.PrediccionResponseDTO;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import com.churninsight.backend.entities.Cliente;
import com.churninsight.backend.services.ClienteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")// Endpoint para gestionar clientes
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Para que el Front se pueda conectar sin problemas de CORS
public class ClienteController {

    private final ClienteService clienteService;

    // Endpoint para guardar un cliente
    @PostMapping
    public ResponseEntity<Cliente> crearCliente(@RequestBody Cliente cliente) {
        System.out.println("DEBUG: ¡La petición llegó al controlador!"); // Si esto no sale en consola, es Seguridad.
        return ResponseEntity.ok(clienteService.guardarCliente(cliente));
    }

    // Endpoint para ver todos los clientes (útil para verificar)
    @GetMapping
    public ResponseEntity<List<Cliente>> obtenerTodos() {
        return ResponseEntity.ok(clienteService.listarClientes());
    }

    // Endpoint para buscar un cliente por ID
    @GetMapping("/{id}")
    public ResponseEntity<Cliente> obtenerPorId(@PathVariable Integer id) {
        return clienteService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/{id}/predecir")
    public ResponseEntity<?> predecirRiesgo(@PathVariable Integer id) {
        // 1. Buscamos el cliente en la base de datos
        return clienteService.buscarPorId(id).map(cliente -> {

            // 2. Preparamos la llamada a Python (Flask)
            RestTemplate restTemplate = new RestTemplate();
            String pythonUrl = "http://ia-service:5000/predict";// Ruta del microservicio Python

            // Creamos el JSON que espera Python con los nombres exactos
            Map<String, Object> requestParaPython = Map.of(
                    "customer_age", cliente.getCustomerAge(),
                    "months_inactive12mon", cliente.getMonthsInactive12Mon(),
                    "contacts_count12mon", cliente.getContactsCount12Mon(),
                    "total_ct_chngq4q1", cliente.getTotalCtChngQ4Q1(),
                    "avg_utilization_ratio", cliente.getAvgUtilizationRatio(),
                    "low_relationship_count", cliente.getLowRelationshipCount(),
                    "genderm", cliente.getGenderM()
            );

            // 3. Enviamos a Python y recibimos la respuesta
            try {
                Map<String, Object> responsePython = restTemplate.postForObject(pythonUrl, requestParaPython, Map.class);

                // 4. Retornamos la respuesta al Front-end
                return ResponseEntity.ok(responsePython);
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("error", "Microservicio Python apagado"));
            }
        //Por si no se encuentra el cliente
        }).orElse(ResponseEntity.notFound().build());
    }


}