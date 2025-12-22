package com.churninsight.backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "clientes")
@Data // Esto ps nos ayuda a  generar Getters, Setters, toString, equals y hashCode automáticamente mas facil
@NoArgsConstructor // Genera constructor vacío ademas es nos da versatilidad (obligatorio para JPA)
@AllArgsConstructor // Genera constructor con todos los campos
public class Cliente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String attritionFlag;
    private Integer customerAge;
    private String gender;
    private Integer dependentCount;
    private String educationLevel;
    private String maritalStatus;
    private String incomeCategoryLimpio;
    private String cardCategory;
    private Integer monthsOnBook;
    private Integer totalRelationshipCount;
    private Integer monthsInactive12Mon;
    private Integer contactsCount12Mon;
    private BigDecimal creditLimit;
    private BigDecimal totalRevolvingBal;
    private BigDecimal avgOpenToBuy;
    private BigDecimal totalAmtChngQ4Q1;
    private BigDecimal totalTransAmt;
    private Integer totalTransCt;
    private BigDecimal totalCtChngQ4Q1;
    private BigDecimal avgUtilizationRatio;
}