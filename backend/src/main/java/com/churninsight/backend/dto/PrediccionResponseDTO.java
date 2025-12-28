package com.churninsight.backend.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class PrediccionResponseDTO {
    private String prevision;
    private BigDecimal probabilidad;
    private Integer clienteId; // Cambiado a Integer para coincidir con el ID del Cliente
}