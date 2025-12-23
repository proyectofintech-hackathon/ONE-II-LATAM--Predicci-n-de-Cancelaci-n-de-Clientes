package com.churninsight.backend.services;

import com.churninsight.backend.dto.ClienteDTO;
import com.churninsight.backend.entities.Cliente;
import com.churninsight.backend.repositories.ClienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Importante para poder hacer la interacciones com la BD
import lombok.RequiredArgsConstructor; // Lombok nos facilita lo el constructor
import java.util.List;
import java.util.Optional;// Para el metido para buscar por ID

@Service
@RequiredArgsConstructor // Inyecta el repositorio automáticamente
public class ClienteService {

    private final ClienteRepository clienteRepository;

    // Método para guardar un cliente nuevo
    @Transactional
    public Cliente guardarCliente(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    // Método para buscar todos (útil para pruebas)
    public List<Cliente> listarClientes() {
        return clienteRepository.findAll();
    }

    // Método para buscar por ID
    public Optional<Cliente> buscarPorId(Long id) {
        return clienteRepository.findById(id);
    }
    public Cliente convertirADominio(ClienteDTO dto) {
        Cliente cliente = new Cliente();
        // Aquí se pasan los datos del DTO a la Entidad
        cliente.setCustomerAge(dto.getCustomerAge());
        cliente.setGender(dto.getGender());
        cliente.setEducationLevel(dto.getEducationLevel());
        cliente.setMaritalStatus(dto.getMaritalStatus());
        cliente.setIncomeCategoryLimpio(dto.getIncomeCategoryLimpio());
        cliente.setCardCategory(dto.getCardCategory());

        // ... así con los campos importantes si no faltan tokaria hablar con el grupo
        return cliente;
    }
}