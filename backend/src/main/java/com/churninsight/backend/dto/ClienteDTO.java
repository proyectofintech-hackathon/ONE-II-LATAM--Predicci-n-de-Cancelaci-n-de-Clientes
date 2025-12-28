package com.churninsight.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClienteDTO {
    private Integer attritionFlag;
    private Integer customerAge;
    private Integer monthsInactive12Mon;
    private Integer contactsCount12Mon;
    private BigDecimal totalCtChngQ4Q1;
    private BigDecimal avgUtilizationRatio;
    private Integer lowRelationshipCount;
    private Integer genderM;
    private Integer cardCategoryGold;
    private Integer cardCategoryPlatinum;
    private Integer cardCategorySilver;
}