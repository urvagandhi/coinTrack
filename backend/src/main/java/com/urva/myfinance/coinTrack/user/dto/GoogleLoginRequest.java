package com.urva.myfinance.coinTrack.user.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for exchanging a Google authorization code for session tokens.
 */
public class GoogleLoginRequest {

    @NotBlank(message = "Authorization code is required")
    private String code;

    private String redirectUri;

    public GoogleLoginRequest() {
    }

    public GoogleLoginRequest(String code, String redirectUri) {
        this.code = code;
        this.redirectUri = redirectUri;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public void setRedirectUri(String redirectUri) {
        this.redirectUri = redirectUri;
    }
}
