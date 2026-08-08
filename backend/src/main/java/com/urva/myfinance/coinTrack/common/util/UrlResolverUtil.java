package com.urva.myfinance.coinTrack.common.util;

import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Utility to resolve the correct URL from a comma-separated list of URLs
 * based on the current request context (Origin, Referer, or Host).
 */
public class UrlResolverUtil {

    public static String resolveUrl(String commaSeparatedUrls) {
        if (commaSeparatedUrls == null || commaSeparatedUrls.trim().isEmpty()) {
            return "";
        }
        
        String[] urls = commaSeparatedUrls.split(",");
        if (urls.length == 1) {
            return urls[0].trim();
        }

        try {
            RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
            if (attrs instanceof ServletRequestAttributes) {
                HttpServletRequest request = ((ServletRequestAttributes) attrs).getRequest();
                
                // 1. Try to match by Origin or Referer (for direct API calls from frontend)
                String origin = request.getHeader("Origin");
                if (origin == null) {
                    origin = request.getHeader("Referer");
                }
                
                if (origin != null) {
                    for (String url : urls) {
                        if (origin.startsWith(url.trim())) {
                            return url.trim();
                        }
                    }
                }
                
                // 2. Try to match by Host (for callbacks from third-party like Zerodha)
                String host = request.getHeader("Host");
                if (host != null) {
                    boolean isLocalHost = host.contains("localhost") || host.contains("127.0.0.1");
                    for (String url : urls) {
                        boolean urlIsLocal = url.contains("localhost") || url.contains("127.0.0.1");
                        if (isLocalHost == urlIsLocal) {
                            return url.trim();
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Ignore context errors
        }
        
        // Fallback to the first URL if we can't determine
        return urls[0].trim();
    }
}
