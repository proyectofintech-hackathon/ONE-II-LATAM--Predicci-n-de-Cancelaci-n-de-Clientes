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
@RequiredArgsConstructor
public class ClienteService {
    private final ClienteRepository clienteRepository;

    @Transactional
    public Cliente guardarCliente(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    public List<Cliente> listarClientes() {
        return clienteRepository.findAll();
    }

    // Cambiamos Long a Integer
    public Optional<Cliente> buscarPorId(Integer id) {
        return clienteRepository.findById(id);
    }

    public Cliente convertirADominio(ClienteDTO dto) {
        Cliente cliente = new Cliente();
    // Actualizacion de los atributos de acuerdo a la bd de el equipo de data science

        cliente.setAttritionFlag(dto.getAttritionFlag());
        cliente.setCustomerAge(dto.getCustomerAge());
        cliente.setMonthsInactive12Mon(dto.getMonthsInactive12Mon());
        cliente.setContactsCount12Mon(dto.getContactsCount12Mon());
        cliente.setTotalCtChngQ4Q1(dto.getTotalCtChngQ4Q1());
        cliente.setAvgUtilizationRatio(dto.getAvgUtilizationRatio());
        cliente.setLowRelationshipCount(dto.getLowRelationshipCount());
        cliente.setGenderM(dto.getGenderM());
        cliente.setCardCategoryGold(dto.getCardCategoryGold());
        cliente.setCardCategoryPlatinum(dto.getCardCategoryPlatinum());
        cliente.setCardCategorySilver(dto.getCardCategorySilver());
        return cliente;
    }
}