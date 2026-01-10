package com.churninsight.backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "clientes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cliente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer attritionFlag;
    private Integer customerAge;
    private Integer monthsInactive12Mon;
    private Integer contactsCount12Mon;
    //colinas de precision y escala ajustadas segun los datos esperados
    @Column(precision = 10, scale = 4)
    private BigDecimal totalCtChngQ4Q1;

    @Column(precision = 10, scale = 4)
    private BigDecimal avgUtilizationRatio;

    private Integer lowRelationshipCount;
    private Integer genderM;
    private Integer cardCategoryGold;
    private Integer cardCategoryPlatinum;
    private Integer cardCategorySilver;
}