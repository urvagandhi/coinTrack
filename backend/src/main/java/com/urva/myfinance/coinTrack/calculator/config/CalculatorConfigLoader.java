package com.urva.myfinance.coinTrack.calculator.config;

import java.io.InputStream;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.yaml.snakeyaml.Yaml;

import jakarta.annotation.PostConstruct;

/**
 * Loads and manages externalized financial configurations from YAML files.
 * Provides a central registry for tax slabs, interest rates, and assumptions.
 */
@Configuration
public class CalculatorConfigLoader {

    private static final Logger logger = LoggerFactory.getLogger(CalculatorConfigLoader.class);

    private Map<String, Object> taxSlabs;
    private Map<String, Object> savingsRates;
    private Map<String, Object> defaultAssumptions;

    private final Yaml yaml = new Yaml();

    @PostConstruct
    public void init() {
        loadConfigurations();
    }

    public void loadConfigurations() {
        logger.info("Loading calculator configurations from resources...");
        try {
            this.taxSlabs = loadYaml("calculator-config/tax-slabs.yml");
            this.savingsRates = loadYaml("calculator-config/savings-rates.yml");
            this.defaultAssumptions = loadYaml("calculator-config/default-assumptions.yml");
            logger.info("Successfully loaded all calculator configurations");
        } catch (Exception e) {
            logger.error("Failed to load calculator configurations", e);
        }
    }

    private Map<String, Object> loadYaml(String path) {
        try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream(path)) {
            if (inputStream == null) {
                logger.warn("Configuration file not found: {}", path);
                return Map.of();
            }
            return yaml.load(inputStream);
        } catch (Exception e) {
            logger.error("Error reading YAML from {}", path, e);
            return Map.of();
        }
    }

    public Map<String, Object> getTaxSlabs() {
        return taxSlabs;
    }

    public Map<String, Object> getSavingsRates() {
        return savingsRates;
    }

    public Map<String, Object> getDefaultAssumptions() {
        return defaultAssumptions;
    }

    /**
     * Get a nested value from the configuration using dot notation (e.g.,
     * "retirement.defaultInflation").
     */
    @SuppressWarnings("unchecked")
    public <T> T getValue(Map<String, Object> config, String key) {
        if (config == null || key == null)
            return null;

        String[] parts = key.split("\\.");
        Object current = config;

        for (String part : parts) {
            if (!(current instanceof Map))
                return null;
            current = ((Map<String, Object>) current).get(part);
        }

        return (T) current;
    }
}
