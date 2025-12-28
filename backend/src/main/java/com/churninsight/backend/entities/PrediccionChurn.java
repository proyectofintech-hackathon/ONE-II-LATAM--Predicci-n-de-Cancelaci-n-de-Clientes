package com.churninsight.backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "predicciones_churn")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrediccionChurn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(precision = 10, scale = 4)
    private BigDecimal probabilidad;

    private Boolean prediccion;

    private LocalDateTime fechaPrediccion = LocalDateTime.now();
}