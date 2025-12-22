package com.churninsight.backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "predicciones_churn")
@Data // Crea Getters, Setters, toString, etc.
@NoArgsConstructor
@AllArgsConstructor
public class PrediccionChurn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne // Relación con la tabla clientes
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    private BigDecimal probabilidadChurn;
    private Boolean prediccion;

    // Se inicializa automáticamente con la fecha/hora actual
    private LocalDateTime fechaPrediccion = LocalDateTime.now();
}