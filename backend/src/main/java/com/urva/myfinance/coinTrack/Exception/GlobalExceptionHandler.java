package com.urva.myfinance.coinTrack.Exception;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        // Wrap in a standard error format if needed, or return the map of field errors
        // directly
        // For simplicity and frontend api.js compatibility, we might want to return a
        // single "error" message
        // OR the full map. Let's return the map but also a summary "message" if
        // possible.
        // But ResponseEntity body must be one type. Let's return the map of errors.
        // Wait, api.js expects `error.response.data.message` or
        // `error.response.data.error`.
        // If we return a map of field->message, api.js might not parse it well unless
        // we change api.js

        // BETTER APPROACH: Return a standard structure.
        Map<String, String> response = new HashMap<>();
        response.put("error", "Validation Failed");

        // Concatenate all errors into a single string for the "message" field so api.js
        // picks it up easily
        StringBuilder sb = new StringBuilder();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            sb.append(error.getDefaultMessage()).append(". ");
        });
        response.put("message", sb.toString().trim());

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", ex.getMessage());
        response.put("message", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST); // Or INTERNAL_SERVER_ERROR depending on usage
    }
}
