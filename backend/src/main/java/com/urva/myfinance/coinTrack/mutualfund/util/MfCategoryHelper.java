package com.urva.myfinance.coinTrack.mutualfund.util;

import java.util.Arrays;
import java.util.List;

public class MfCategoryHelper {

    private static final List<String> EQUITY_CATEGORIES = Arrays.asList(
            "Large Cap",
            "Large & Mid Cap",
            "Mid Cap",
            "Small Cap",
            "Multi Cap",
            "Flexi Cap",
            "Focused",
            "Value",
            "Contra",
            "Dividend Yield",
            "ELSS",
            "Sectoral",
            "Thematic"
    );

    public static boolean isEquityOriented(String category) {
        if (category == null || category.trim().isEmpty()) {
            return false;
        }
        
        // Exact match from known equity categories
        for (String eqCat : EQUITY_CATEGORIES) {
            if (eqCat.equalsIgnoreCase(category.trim())) {
                return true;
            }
        }
        
        // Fallback for custom categories containing "Equity" or similar
        String lowerCat = category.toLowerCase();
        if (lowerCat.contains("equity") || lowerCat.contains("flexi") || lowerCat.contains("small cap") || lowerCat.contains("mid cap") || lowerCat.contains("large cap")) {
            return true;
        }
        
        return false;
    }
}
