package com.churninsight.backend.controllers;

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
}