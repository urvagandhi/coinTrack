package com.urva.myfinance.coinTrack.calculator.config;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CalculatorConfigLoaderTest {

    private CalculatorConfigLoader loader;

    @BeforeEach
    void setUp() {
        loader = new CalculatorConfigLoader();
    }

    @Test
    @DisplayName("1. init does not throw")
    void init_DoesNotThrow() {
        assertDoesNotThrow(loader::init);
    }

    @Test
    @DisplayName("2. getValue with null config returns null")
    void getValue_NullConfig_ReturnsNull() {
        assertNull(loader.getValue(null, "key"));
    }

    @Test
    @DisplayName("3. getValue with null key returns null")
    void getValue_NullKey_ReturnsNull() {
        assertNull(loader.getValue(Map.of("key", "value"), null));
    }

    @Test
    @DisplayName("4. getValue with simple key returns value")
    void getValue_SimpleKey_ReturnsValue() {
        Map<String, Object> config = Map.of("name", "test");
        assertEquals("test", loader.getValue(config, "name"));
    }

    @Test
    @DisplayName("5. getValue with dot notation navigates nested maps")
    void getValue_DotNotation_NavigatesNested() {
        Map<String, Object> nested = Map.of(
                "level1", Map.of("level2", "deep-value"));
        assertEquals("deep-value", loader.getValue(nested, "level1.level2"));
    }

    @Test
    @DisplayName("6. getValue with missing key returns null")
    void getValue_MissingKey_ReturnsNull() {
        Map<String, Object> config = Map.of("name", "test");
        assertNull(loader.getValue(config, "nonexistent"));
    }

    @Test
    @DisplayName("7. getValue with non-map intermediate returns null")
    void getValue_NonMapIntermediate_ReturnsNull() {
        Map<String, Object> config = Map.of("key", "not-a-map");
        assertNull(loader.getValue(config, "key.nested"));
    }

    @Test
    @DisplayName("8. loadConfigurations handles missing YAML files gracefully")
    void loadConfigurations_MissingFiles_HandlesGracefully() {
        assertDoesNotThrow(loader::loadConfigurations);
        assertNotNull(loader.getTaxSlabs());
        assertNotNull(loader.getSavingsRates());
        assertNotNull(loader.getDefaultAssumptions());
    }
}
