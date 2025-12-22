package com.churninsight.backend.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class PrediccionResponseDTO {
    private String prevision; // Ejemplo: "Va a cancelar,continuar" etc.
    private BigDecimal probabilidad; // Ejemplo: 0.81 o cualquier valor entre 0 y 1 creo yo
    private Long clienteId;
}