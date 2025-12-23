package com.churninsight.backend.dto;
/*En este proyecto de Churn, el cliente envía muchos datos (edad, salario, etc.),
 pero nosotros noqueremos exponer nuestra entidad de base de datos directamente
 por seguridad y orden. El DTO actúa como un filtro.*/
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClienteDTO {
    // No incluimos el ID porque el ID lo genera la base de datos ej: auto_increment
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