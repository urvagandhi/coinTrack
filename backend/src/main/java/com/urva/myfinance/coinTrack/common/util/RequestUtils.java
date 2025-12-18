package com.urva.myfinance.coinTrack.common.util;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Utility class for extracting network information from HTTP requests.
 */
public final class RequestUtils {

    private RequestUtils() {
        // Utility class
    }

    /**
     * Extract client IP address from HTTP request.
     * Handles:
     * - X-Forwarded-For header (proxy/load balancer)
     * - X-Real-IP header (nginx)
     * - IPv6 loopback conversion to readable format
     *
     * @param request HTTP request
     * @return Client IP address or "Unknown"
     */
    public static String extractIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "Unknown";
        }

        String ip = null;

        // Check X-Forwarded-For header (common for proxies/load balancers)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            // Take the first IP in the chain (original client)
            ip = xForwardedFor.split(",")[0].trim();
        }

        // Check X-Real-IP header (nginx)
        if (ip == null || ip.isEmpty()) {
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
                ip = xRealIp;
            }
        }

        // Fall back to remote address
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }

        // Convert IPv6 loopback to readable format
        return normalizeLoopback(ip);
    }

    /**
     * Convert IPv6 loopback addresses to more readable format.
     */
    private static String normalizeLoopback(String ip) {
        if (ip == null) {
            return "Unknown";
        }

        // IPv6 loopback variations
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return "127.0.0.1 (localhost)";
        }

        // IPv4 loopback
        if ("127.0.0.1".equals(ip)) {
            return "127.0.0.1 (localhost)";
        }

        return ip;
    }

    /**
     * Extract User-Agent from HTTP request.
     *
     * @param request HTTP request
     * @return User-Agent string or "Unknown"
     */
    public static String extractUserAgent(HttpServletRequest request) {
        if (request == null) {
            return "Unknown";
        }
        String userAgent = request.getHeader("User-Agent");
        return userAgent != null ? userAgent : "Unknown";
    }
}
