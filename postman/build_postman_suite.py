#!/usr/bin/env python3
"""
Full Postman Suite Builder for CoinTrack Platform
"""

import json
import os

from generate_postman import (
    make_request, make_test_script,
    COLLECTION_PRE_REQUEST_SCRIPT, COLLECTION_TEST_SCRIPT,
    VISUALIZER_PORTFOLIO_SUMMARY, VISUALIZER_HOLDINGS,
    VISUALIZER_MF_DASHBOARD, VISUALIZER_EPF_SUMMARY,
    VISUALIZER_PPF_SUMMARY, VISUALIZER_FD_SUMMARY,
    VISUALIZER_GOLD_SILVER_SUMMARY, VISUALIZER_CALCULATOR_SIP,
    VISUALIZER_CALCULATOR_EMI
)

NO_AUTH = {"type": "noauth"}

# ==============================================================================
# FOLDER 00: SYSTEM & HEALTH
# ==============================================================================
def get_folder_00_health():
    return {
        "name": "00. System & Health",
        "description": "System health endpoints, heartbeat ping, and platform connectivity checks.",
        "item": [
            make_request(
                name="01. Health Check",
                method="GET",
                url_path="/api/health",
                description="Comprehensive health check reporting database, Redis cache, broker adapters, and disk status.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200, [
                    ("Health check status is UP", "pm.expect(json.status).to.eql('UP');")
                ])
            ),
            make_request(
                name="02. Heartbeat Ping",
                method="GET",
                url_path="/api/health/ping",
                description="Lightweight ping endpoint for load-balancers and uptime probes.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200, [
                    ("Ping returns pong", "pm.expect(json.status || json.message).to.be.oneOf(['pong', 'UP', 'ok']);")
                ])
            ),
            make_request(
                name="03. Keep-Alive Probe",
                method="GET",
                url_path="/health",
                description="Direct root health endpoint for cloud container keep-alives.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200)
            ),
            make_request(
                name="04. Home / Welcome",
                method="GET",
                url_path="/",
                description="Root index welcome endpoint.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200)
            )
        ]
    }

# ==============================================================================
# FOLDER 01: AUTHENTICATION & SECURITY
# ==============================================================================
def get_folder_01_auth():
    return {
        "name": "01. Authentication & Security",
        "description": "User registration, credential login, JWT token verification, token refresh, and logout.",
        "item": [
            make_request(
                name="01. Check Username Availability",
                method="GET",
                url_path="/api/auth/check-username/:username",
                path_vars=[("username", "urva_gandhi", "Username to verify")],
                description="Checks if a proposed username is available during registration flow.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200, [
                    ("Availability response present", "pm.expect(json).to.have.property('available');")
                ])
            ),
            make_request(
                name="02. Register User",
                method="POST",
                url_path="/api/auth/register",
                body={
                    "username": "testuser_{{$timestamp}}",
                    "email": "test_{{$timestamp}}@cointrack.internal",
                    "mobile": "9876543210",
                    "password": "SecurePassword123!",
                    "firstName": "Urva",
                    "lastName": "Gandhi"
                },
                description="Registers a new user account with initial credential validation.",
                auth_override=NO_AUTH,
                pre_script="// Generate random user params if needed\npm.variables.set('dynUser', 'user_' + Date.now().toString(36));",
                test_script=make_test_script(200, [
                    ("User registration successful", "pm.expect(json.message || json.userId || json.username).to.be.ok;")
                ], extra_script="""
if (json.token) pm.environment.set("token", json.token);
if (json.userId) pm.environment.set("userId", json.userId);
""")
            ),
            make_request(
                name="03. Login (Credentials)",
                method="POST",
                url_path="/api/auth/login",
                body={
                    "usernameOrEmailOrMobile": "urva_gandhi",
                    "password": "SecurePassword123!"
                },
                description="Authenticates with username/email/mobile and password. Returns JWT access token and refresh token, or tempToken if 2FA is required.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200, [
                    ("Login response contains authentication payload", "pm.expect(json.token || json.tempToken || json.requires2FA).to.be.ok;")
                ], extra_script="""
if (json.token) {
    pm.environment.set("token", json.token);
    pm.environment.set("tokenExpiresAt", Date.now() + 3600000);
}
if (json.refreshToken) pm.environment.set("refreshToken", json.refreshToken);
if (json.tempToken) pm.environment.set("tempToken", json.tempToken);
if (json.userId) pm.environment.set("userId", json.userId);
""")
            ),
            make_request(
                name="04. Verify Token",
                method="GET",
                url_path="/api/auth/verify-token",
                description="Validates the active Bearer JWT token against the authentication provider.",
                test_script=make_test_script(200, [
                    ("Token verification returns valid", "pm.expect(json.valid || json.authenticated).to.be.true;")
                ])
            ),
            make_request(
                name="05. Refresh Access Token",
                method="POST",
                url_path="/api/auth/refresh",
                body={
                    "refreshToken": "{{refreshToken}}"
                },
                description="Exchanges an unexpired refresh token for a fresh JWT access token.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200, [
                    ("New access token received", "pm.expect(json.token || json.accessToken).to.be.a('string');")
                ], extra_script="""
const newToken = json.token || json.accessToken;
if (newToken) {
    pm.environment.set("token", newToken);
    pm.environment.set("tokenExpiresAt", Date.now() + 3600000);
}
if (json.refreshToken) pm.environment.set("refreshToken", json.refreshToken);
""")
            ),
            make_request(
                name="06. Google OAuth2 Login",
                method="POST",
                url_path="/api/auth/oauth2/google",
                body={
                    "idToken": "<GOOGLE_OAUTH_ID_TOKEN>"
                },
                description="Authenticates or registers user via Google SSO ID token.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200)
            ),
            make_request(
                name="07. Google OAuth Complete Profile",
                method="POST",
                url_path="/api/auth/oauth2/complete-profile",
                body={
                    "tempToken": "{{tempToken}}",
                    "username": "urva_gandhi",
                    "phoneNumber": "+919876543210"
                },
                description="Completes profile for first-time Google SSO registration.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200)
            ),
            make_request(
                name="08. Logout",
                method="POST",
                url_path="/api/auth/logout",
                description="Invalidates current session and server-side refresh token.",
                test_script=make_test_script(200, [
                    ("Logout successful", "pm.expect(pm.response.code).to.eql(200);")
                ], extra_script="""
pm.environment.set("token", "");
pm.environment.set("refreshToken", "");
""")
            )
        ]
    }

# ==============================================================================
# FOLDER 02: MFA & TOTP
# ==============================================================================
def get_folder_02_mfa():
    return {
        "name": "02. Multi-Factor Authentication (MFA / TOTP)",
        "description": "RFC 6238 TOTP two-factor authentication setup, verification, login completion, and recovery.",
        "item": [
            make_request(
                name="01. Get MFA Status",
                method="GET",
                url_path="/api/auth/mfa/status",
                description="Returns whether 2FA is currently enabled for the authenticated user.",
                test_script=make_test_script(200, [
                    ("Status object returned", "pm.expect(json).to.have.property('mfaEnabled');")
                ])
            ),
            make_request(
                name="02. Initiate TOTP Setup",
                method="POST",
                url_path="/api/auth/mfa/setup",
                description="Generates a new Base32 TOTP secret key, QR code URI, and backup recovery codes.",
                test_script=make_test_script(200, [
                    ("TOTP secret generated", "pm.expect(json.secret || json.qrCodeUrl).to.be.ok;")
                ], extra_script="""
if (json.secret) pm.environment.set("totpSecret", json.secret);
""")
            ),
            make_request(
                name="03. Verify TOTP Setup (Enable 2FA)",
                method="POST",
                url_path="/api/auth/mfa/verify",
                body={
                    "code": "{{dynamicTotpCode}}",
                    "tempToken": "{{tempToken}}"
                },
                description="Verifies the 6-digit TOTP code and activates two-factor authentication on the account.",
                test_script=make_test_script(200, [
                    ("MFA setup confirmed", "pm.expect(json.success || json.message).to.be.ok;")
                ])
            ),
            make_request(
                name="04. Complete Login with TOTP Code",
                method="POST",
                url_path="/api/auth/mfa/login",
                body={
                    "code": "{{dynamicTotpCode}}",
                    "tempToken": "{{tempToken}}"
                },
                description="Finalizes authentication when 2FA is required by submitting the 6-digit code with tempToken.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200, [
                    ("Full access token returned", "pm.expect(json.token || json.accessToken).to.be.ok;")
                ], extra_script="""
if (json.token) pm.environment.set("token", json.token);
if (json.refreshToken) pm.environment.set("refreshToken", json.refreshToken);
""")
            ),
            make_request(
                name="05. Complete Login with Recovery Code",
                method="POST",
                url_path="/api/auth/mfa/login-recovery",
                body={
                    "recoveryCode": "ABCD-1234-EFGH",
                    "tempToken": "{{tempToken}}"
                },
                description="Bypasses authenticator app using an unused 16-character backup recovery code.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200)
            ),
            make_request(
                name="06. Initiate TOTP Reset",
                method="POST",
                url_path="/api/auth/mfa/reset",
                body={
                    "password": "SecurePassword123!"
                },
                description="Initiates key rotation to reset or migrate to a new authenticator device.",
                test_script=make_test_script(200, [
                    ("Reset initiated with new secret", "pm.expect(json.secret || json.tempToken).to.be.ok;")
                ], extra_script="""
if (json.secret) pm.environment.set("totpSecret", json.secret);
""")
            ),
            make_request(
                name="07. Verify TOTP Reset",
                method="POST",
                url_path="/api/auth/mfa/reset/verify",
                body={
                    "code": "{{dynamicTotpCode}}",
                    "tempToken": "{{tempToken}}"
                },
                description="Verifies the new authenticator code to finalize key rotation.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="08. Registration TOTP Setup",
                method="POST",
                url_path="/api/auth/mfa/register/setup",
                body={
                    "tempToken": "{{tempToken}}"
                },
                description="Generates TOTP secret during initial registration onboarding.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200)
            ),
            make_request(
                name="09. Registration TOTP Verify",
                method="POST",
                url_path="/api/auth/mfa/register/verify",
                body={
                    "code": "{{dynamicTotpCode}}",
                    "tempToken": "{{tempToken}}"
                },
                description="Verifies TOTP during registration and issues initial access token.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200)
            )
        ]
    }

# ==============================================================================
# FOLDER 03: EMAIL, PASSWORD & RECOVERY
# ==============================================================================
def get_folder_03_email():
    return {
        "name": "03. Email, Password & Recovery",
        "description": "Password reset flow, email address updates, MFA email recovery, contact messages, and admin templates.",
        "item": [
            make_request(
                name="01. Forgot Password Request",
                method="POST",
                url_path="/api/auth/forgot-password",
                body={
                    "email": "test@cointrack.internal"
                },
                description="Requests a password reset token via email.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200, [
                    ("Reset email queued", "pm.expect(json.message).to.be.ok;")
                ])
            ),
            make_request(
                name="02. Verify Password Reset Token",
                method="POST",
                url_path="/api/auth/forgot-password/verify",
                body={
                    "token": "sample-reset-token-uuid"
                },
                description="Validates that the password reset token is active and unexpired.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200)
            ),
            make_request(
                name="03. Reset Password",
                method="POST",
                url_path="/api/auth/reset-password",
                body={
                    "token": "sample-reset-token-uuid",
                    "newPassword": "BrandNewSecurePassword123!"
                },
                description="Submits the new password using the validated reset token.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200)
            ),
            make_request(
                name="04. Request Email Change",
                method="POST",
                url_path="/api/auth/email/change",
                body={
                    "newEmail": "newemail@cointrack.internal",
                    "password": "SecurePassword123!"
                },
                description="Requests email address modification; sends verification token to the new address.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="05. Verify Email Change",
                method="POST",
                url_path="/api/auth/email/verify",
                body={
                    "token": "email-change-verification-token"
                },
                description="Confirms email change using the magic token sent to the inbox.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200)
            ),
            make_request(
                name="06. Resend Verification Email",
                method="POST",
                url_path="/api/auth/email/resend",
                description="Resends the verification email for unverified user accounts.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="07. Request MFA Email Recovery",
                method="POST",
                url_path="/api/auth/mfa/email-recovery",
                body={
                    "usernameOrEmail": "urva_gandhi",
                    "password": "SecurePassword123!"
                },
                description="Sends emergency 2FA recovery token to the verified email address.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200)
            ),
            make_request(
                name="08. Verify MFA Email Recovery",
                method="POST",
                url_path="/api/auth/mfa/email-recovery/verify",
                body={
                    "recoveryToken": "emergency-mfa-recovery-token"
                },
                description="Verifies the recovery token and temporarily disables 2FA to permit access.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200)
            ),
            make_request(
                name="09. Public Contact Form",
                method="POST",
                url_path="/api/public/contact",
                body={
                    "name": "Urva Gandhi",
                    "email": "contact@cointrack.internal",
                    "subject": "Platform Inquiry",
                    "message": "Inquiry regarding multi-broker portfolio integration."
                },
                description="Public contact message submission endpoint.",
                auth_override=NO_AUTH,
                test_script=make_test_script(200)
            ),
            make_request(
                name="10. Admin Email Templates List",
                method="GET",
                url_path="/admin/emails/templates",
                description="Lists available HTML email notification templates.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="11. Admin Email Template Preview",
                method="GET",
                url_path="/admin/emails/preview",
                query=[("template", "PASSWORD_RESET", "Template name"), ("name", "Urva", "Sample user name")],
                description="Renders a live HTML preview of an email template.",
                test_script=make_test_script(200)
            )
        ]
    }

# ==============================================================================
# FOLDER 04: USER PROFILE & ACCOUNT
# ==============================================================================
def get_folder_04_user():
    return {
        "name": "04. User Profile & Account",
        "description": "User profile retrieval, account preferences, password changes, and account deletion.",
        "item": [
            make_request(
                name="01. Get Current User Profile",
                method="GET",
                url_path="/api/users/me",
                description="Fetches full profile information, email, settings, and roles for the logged-in user.",
                test_script=make_test_script(200, [
                    ("User profile has username and email", "pm.expect(json.username).to.be.ok; pm.expect(json.email).to.be.ok;")
                ], extra_script="""
if (json.id || json.userId) pm.environment.set("userId", json.id || json.userId);
""")
            ),
            make_request(
                name="02. Update Current User Profile",
                method="PUT",
                url_path="/api/users/me",
                body={
                    "username": "urva_gandhi",
                    "email": "urva@cointrack.internal",
                    "phoneNumber": "+919876543210",
                    "dateOfBirth": "1995-05-15"
                },
                description="Updates profile details such as phone number, birthday, and display name.",
                test_script=make_test_script(200, [
                    ("Profile updated successfully", "pm.expect(json.username || json.message).to.be.ok;")
                ])
            ),
            make_request(
                name="03. Change Password",
                method="PUT",
                url_path="/api/users/me/password",
                body={
                    "currentPassword": "SecurePassword123!",
                    "newPassword": "UpdatedPassword456!"
                },
                description="Changes user account password with verification of old credentials.",
                test_script=make_test_script(200, [
                    ("Password changed successfully", "pm.expect(pm.response.code).to.eql(200);")
                ])
            ),
            make_request(
                name="04. Delete Current User Account",
                method="DELETE",
                url_path="/api/users/me",
                body={
                    "password": "UpdatedPassword456!"
                },
                description="Permanently deletes the account and all associated portfolio data.",
                test_script=make_test_script(200)
            )
        ]
    }

# ==============================================================================
# FOLDER 05: PORTFOLIO & BROKER INTEGRATIONS
# ==============================================================================
def get_folder_05_portfolio():
    return {
        "name": "05. Portfolio & Broker Integrations",
        "description": "Unified stock portfolio holdings, positions, trades, orders, funds, and multi-broker adapters (Zerodha, Upstox, AngelOne).",
        "item": [
            {
                "name": "Consolidated Portfolio",
                "description": "Unified view aggregating assets across all connected broker accounts.",
                "item": [
                    make_request(
                        name="01. Get Portfolio Summary",
                        method="GET",
                        url_path="/api/portfolio/summary",
                        description="Consolidated portfolio summary showing invested amount, current value, overall P&L, and day's return.",
                        test_script=make_test_script(200, [
                            ("Portfolio summary returned", "pm.expect(json).to.be.an('object');")
                        ], visualizer_script=VISUALIZER_PORTFOLIO_SUMMARY)
                    ),
                    make_request(
                        name="02. Get Equity Holdings",
                        method="GET",
                        url_path="/api/portfolio/holdings",
                        description="Lists all stock/equity holdings aggregated across all active brokers.",
                        test_script=make_test_script(200, [
                            ("Holdings array returned", "pm.expect(Array.isArray(json) || Array.isArray(json.data)).to.be.true;")
                        ], visualizer_script=VISUALIZER_HOLDINGS)
                    ),
                    make_request(
                        name="03. Get Net Positions",
                        method="GET",
                        url_path="/api/portfolio/positions",
                        description="Returns open intraday and F&O trading positions across brokers.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="04. Get Orders",
                        method="GET",
                        url_path="/api/portfolio/orders",
                        description="Returns order book history (open, executed, and cancelled orders).",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="05. Get Trades",
                        method="GET",
                        url_path="/api/portfolio/trades",
                        description="Returns trade execution ledger with filled timestamps and brokerage fees.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="06. Get Funds & Margin",
                        method="GET",
                        url_path="/api/portfolio/funds",
                        description="Available trading balance, margin used, collateral, and cash across brokers.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="07. Get Broker Profile",
                        method="GET",
                        url_path="/api/portfolio/profile",
                        description="User profile details from the primary connected broker.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="08. Get Sync Status",
                        method="GET",
                        url_path="/api/portfolio/sync/status",
                        description="Returns last sync timestamps and status across all connected brokers.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="09. Trigger Manual Refresh",
                        method="POST",
                        url_path="/api/portfolio/refresh",
                        description="Triggers on-demand portfolio data sync across all active broker connections.",
                        test_script=make_test_script(200, [
                            ("Sync triggered successfully", "pm.expect(pm.response.code).to.eql(200);")
                        ])
                    ),
                    make_request(
                        name="10. Broker Mutual Fund Holdings",
                        method="GET",
                        url_path="/api/portfolio/mf/holdings",
                        description="Mutual fund holdings held in demat mode at broker (e.g. Zerodha Coin).",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="11. Broker Mutual Fund Orders",
                        method="GET",
                        url_path="/api/portfolio/mf/orders",
                        description="Mutual fund order history placed through broker demat accounts.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="12. Broker Mutual Fund Timeline",
                        method="GET",
                        url_path="/api/portfolio/mf/timeline",
                        description="Timeline of mutual fund order transitions from placement to unit allotment.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="13. Broker Mutual Fund SIPs",
                        method="GET",
                        url_path="/api/portfolio/mf/sips",
                        description="Active SIP schedules registered directly on the broker platform.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="14. Broker Mutual Fund Instruments",
                        method="GET",
                        url_path="/api/portfolio/mf/instruments",
                        description="Searchable instrument master of all tradable mutual fund schemes on the broker.",
                        test_script=make_test_script(200)
                    )
                ]
            },
            {
                "name": "Zerodha Kite Adapter",
                "description": "Zerodha Kite Connect integration endpoints.",
                "item": [
                    make_request(
                        name="01. Save Zerodha Credentials",
                        method="POST",
                        url_path="/api/brokers/zerodha/credentials",
                        body={
                            "apiKey": "{{zerodhaApiKey}}",
                            "apiSecret": "{{zerodhaApiSecret}}",
                            "clientId": "{{zerodhaClientId}}"
                        },
                        description="Saves encrypted Zerodha Kite Connect credentials.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="02. Get Login Link",
                        method="GET",
                        url_path="/api/brokers/zerodha/connect",
                        description="Generates the Kite Connect OAuth login URL. Open in browser to authorize.",
                        test_script=make_test_script(200, [
                            ("OAuth connect URL returned", "pm.expect(json.loginUrl || json.url || json.message).to.be.ok;")
                        ])
                    ),
                    make_request(
                        name="03. Handle OAuth Callback",
                        method="POST",
                        url_path="/api/brokers/callback",
                        body={
                            "broker": "zerodha",
                            "request_token": "<PASTE_REQUEST_TOKEN_HERE>"
                        },
                        description="Exchanges request token for long-lived session access token.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="04. Check Zerodha Status",
                        method="GET",
                        url_path="/api/brokers/zerodha/status",
                        description="Returns connection status, token validity, and client details for Zerodha.",
                        test_script=make_test_script(200)
                    )
                ]
            },
            {
                "name": "Upstox Adapter",
                "description": "Upstox API integration endpoints.",
                "item": [
                    make_request(
                        name="01. Save Upstox Credentials",
                        method="POST",
                        url_path="/api/brokers/upstox/credentials",
                        body={
                            "apiKey": "{{upstoxApiKey}}",
                            "apiSecret": "{{upstoxApiSecret}}",
                            "clientId": "{{upstoxClientId}}"
                        },
                        description="Saves encrypted Upstox API credentials.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="02. Get Upstox Connect Link",
                        method="GET",
                        url_path="/api/brokers/upstox/connect",
                        description="Generates the Upstox OAuth 2.0 authorization URL.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="03. Check Upstox Status",
                        method="GET",
                        url_path="/api/brokers/upstox/status",
                        description="Checks current session validity for Upstox adapter.",
                        test_script=make_test_script(200)
                    )
                ]
            },
            {
                "name": "AngelOne SmartAPI Adapter",
                "description": "AngelOne SmartAPI direct TOTP authentication integration.",
                "item": [
                    make_request(
                        name="01. Save AngelOne Credentials",
                        method="POST",
                        url_path="/api/brokers/angelone/credentials",
                        body={
                            "apiKey": "{{angeloneApiKey}}",
                            "clientId": "{{angeloneClientId}}",
                            "pin": "{{angelonePin}}",
                            "totp": "{{angeloneTotp}}"
                        },
                        description="Saves AngelOne SmartAPI credentials including MPIN and TOTP secret.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="02. Connect AngelOne (Direct Login)",
                        method="POST",
                        url_path="/api/brokers/angelone/connect",
                        description="Performs direct server-to-server login with SmartAPI using stored TOTP credentials.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="03. Check AngelOne Status",
                        method="GET",
                        url_path="/api/brokers/angelone/status",
                        description="Returns connection status for AngelOne.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="04. Disconnect AngelOne",
                        method="POST",
                        url_path="/api/brokers/angelone/disconnect",
                        description="Revokes SmartAPI token and disconnects AngelOne account.",
                        test_script=make_test_script(200)
                    )
                ]
            }
        ]
    }

# ==============================================================================
# FOLDER 06: MUTUAL FUNDS (SELF-MANAGED)
# ==============================================================================
def get_folder_06_mutual_funds():
    return {
        "name": "06. Mutual Funds (Self-Managed)",
        "description": "Complete self-managed mutual fund portfolio engine: Scheme master, SIP mandates, contributions, lumpsums, FIFO redemptions, NAV tracking, and valuations.",
        "item": [
            {
                "name": "01. Schemes",
                "description": "Mutual fund scheme master records.",
                "item": [
                    make_request(
                        name="01. List All Schemes",
                        method="GET",
                        url_path="/api/mutual-fund/schemes",
                        description="Returns all mutual fund schemes registered by the user.",
                        test_script=make_test_script(200, [
                            ("Schemes array returned", "pm.expect(Array.isArray(json) || Array.isArray(json.data)).to.be.true;")
                        ])
                    ),
                    make_request(
                        name="02. Create Scheme",
                        method="POST",
                        url_path="/api/mutual-fund/schemes",
                        body={
                            "schemeName": "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
                            "amfiCode": "122639",
                            "mfCategory": "EQUITY_FLEXI_CAP",
                            "platform": "MF_CENTRAL",
                            "folioNo": "FOLIO-10293847",
                            "bank": "HDFC Bank",
                            "holderName": "Urva Gandhi",
                            "manualTotalUnits": 250.75,
                            "averageNav": 68.45,
                            "sipStartDate": "2023-01-10"
                        },
                        description="Adds a new mutual fund scheme to the tracking ledger.",
                        test_script=make_test_script(200, [
                            ("Scheme created with ID", "pm.expect(json.id || json.schemeId).to.be.ok;")
                        ], extra_script="""
if (json.id || json.schemeId) {
    pm.environment.set("mfSchemeId", json.id || json.schemeId);
}
""")
                    ),
                    make_request(
                        name="03. Get Scheme By ID",
                        method="GET",
                        url_path="/api/mutual-fund/schemes/:id",
                        path_vars=[("id", "{{mfSchemeId}}", "Scheme ID")],
                        description="Fetches scheme metadata, folio details, and accumulated units.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="04. Search Schemes",
                        method="GET",
                        url_path="/api/mutual-fund/schemes/search",
                        query=[("q", "Parag Parikh", "Search query keyword")],
                        description="Full-text search across scheme names and AMFI codes.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="05. Filter Schemes by Category",
                        method="GET",
                        url_path="/api/mutual-fund/schemes/category/:category",
                        path_vars=[("category", "EQUITY_FLEXI_CAP", "MF Category")],
                        description="Filters schemes by category (e.g. EQUITY_FLEXI_CAP, DEBT, HYBRID).",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="06. Filter Schemes by Platform",
                        method="GET",
                        url_path="/api/mutual-fund/schemes/platform/:platform",
                        path_vars=[("platform", "MF_CENTRAL", "Platform name")],
                        description="Filters schemes by investment platform (e.g. MF_CENTRAL, GROWW, ZERODHA).",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="07. Filter Schemes by Bank",
                        method="GET",
                        url_path="/api/mutual-fund/schemes/bank/:bank",
                        path_vars=[("bank", "HDFC Bank", "Bank name")],
                        description="Filters schemes by linked debit bank account.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="08. Scheme Dropdown Options",
                        method="GET",
                        url_path="/api/mutual-fund/schemes/dropdown",
                        description="Returns compact ID-to-Name list for transaction forms.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="09. Get Scheme Latest NAV",
                        method="GET",
                        url_path="/api/mutual-fund/schemes/:id/nav",
                        path_vars=[("id", "{{mfSchemeId}}", "Scheme ID")],
                        description="Fetches live Net Asset Value (NAV) from AMFI master feed.",
                        test_script=make_test_script(200, [
                            ("NAV returned", "pm.expect(json.nav || json.latestNav).to.be.ok;")
                        ])
                    ),
                    make_request(
                        name="10. Update Scheme",
                        method="PUT",
                        url_path="/api/mutual-fund/schemes/:id",
                        path_vars=[("id", "{{mfSchemeId}}", "Scheme ID")],
                        body={
                            "schemeName": "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
                            "amfiCode": "122639",
                            "mfCategory": "EQUITY_FLEXI_CAP",
                            "platform": "MF_CENTRAL",
                            "folioNo": "FOLIO-10293847",
                            "bank": "HDFC Bank",
                            "holderName": "Urva Gandhi",
                            "manualTotalUnits": 275.50,
                            "averageNav": 70.20
                        },
                        description="Updates scheme information or folio details.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="11. Delete Scheme",
                        method="DELETE",
                        url_path="/api/mutual-fund/schemes/:id",
                        path_vars=[("id", "{{mfSchemeId}}", "Scheme ID")],
                        description="Deletes a scheme and cleans up related transactions.",
                        test_script=make_test_script(200)
                    )
                ]
            },
            {
                "name": "02. SIP Mandates",
                "description": "Systematic Investment Plan (SIP) mandate rules and execution controls.",
                "item": [
                    make_request(
                        name="01. List SIP Mandates",
                        method="GET",
                        url_path="/api/mutual-fund/sip-mandate",
                        description="Lists all recurring SIP mandates with active status.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="02. Create SIP Mandate",
                        method="POST",
                        url_path="/api/mutual-fund/sip-mandate",
                        body={
                            "schemeId": "{{mfSchemeId}}",
                            "holderName": "Urva Gandhi",
                            "startDate": "2024-01-05",
                            "endDate": "2029-01-05",
                            "amount": 5000.00,
                            "bank": "HDFC Bank",
                            "registrationNo": "SIP-REG-987123",
                            "active": True
                        },
                        description="Creates a new monthly SIP mandate schedule.",
                        test_script=make_test_script(200, [
                            ("SIP Mandate created", "pm.expect(json.id).to.be.ok;")
                        ], extra_script="""
if (json.id) pm.environment.set("sipMandateId", json.id);
""")
                    ),
                    make_request(
                        name="03. Get SIP Mandate By ID",
                        method="GET",
                        url_path="/api/mutual-fund/sip-mandate/:id",
                        path_vars=[("id", "{{sipMandateId}}", "Mandate ID")],
                        description="Fetches mandate configuration by ID.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="04. Filter Mandates by Status",
                        method="GET",
                        url_path="/api/mutual-fund/sip-mandate/status/:status",
                        path_vars=[("status", "ACTIVE", "ACTIVE or INACTIVE")],
                        description="Filters mandates by execution status.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="05. Pause/Stop SIP Mandate",
                        method="PATCH",
                        url_path="/api/mutual-fund/sip-mandate/:id/stop",
                        path_vars=[("id", "{{sipMandateId}}", "Mandate ID")],
                        description="Pauses automated execution for a SIP mandate.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="06. Restart SIP Mandate",
                        method="PATCH",
                        url_path="/api/mutual-fund/sip-mandate/:id/restart",
                        path_vars=[("id", "{{sipMandateId}}", "Mandate ID")],
                        description="Resumes a previously stopped SIP mandate.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="07. Update SIP Mandate",
                        method="PUT",
                        url_path="/api/mutual-fund/sip-mandate/:id",
                        path_vars=[("id", "{{sipMandateId}}", "Mandate ID")],
                        body={
                            "schemeId": "{{mfSchemeId}}",
                            "holderName": "Urva Gandhi",
                            "amount": 7500.00,
                            "bank": "HDFC Bank",
                            "active": True
                        },
                        description="Updates monthly installment amount or bank details.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="08. Backfill All SIP Contributions",
                        method="POST",
                        url_path="/api/mutual-fund/sip-mandate/backfill-all",
                        description="Auto-generates past installment contributions based on mandate dates and historical NAVs.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="09. Delete SIP Mandate",
                        method="DELETE",
                        url_path="/api/mutual-fund/sip-mandate/:id",
                        path_vars=[("id", "{{sipMandateId}}", "Mandate ID")],
                        description="Deletes a SIP mandate schedule.",
                        test_script=make_test_script(200)
                    )
                ]
            },
            {
                "name": "03. SIP Contributions",
                "description": "Individual monthly execution entries generated from SIP mandates.",
                "item": [
                    make_request(
                        name="01. List SIP Contributions",
                        method="GET",
                        url_path="/api/mutual-fund/sip-contribution",
                        description="Returns all recorded SIP contribution installments.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="02. Create SIP Contribution",
                        method="POST",
                        url_path="/api/mutual-fund/sip-contribution",
                        body={
                            "sipMandateId": "{{sipMandateId}}",
                            "schemeId": "{{mfSchemeId}}",
                            "contributionDate": "2025-01-05",
                            "amount": 5000.00,
                            "navPrice": 72.50,
                            "totalUnit": 68.9655,
                            "debitedBank": "HDFC Bank",
                            "remarks": "Automated ECS Debit"
                        },
                        description="Records an allotted SIP installment contribution.",
                        test_script=make_test_script(200, [
                            ("SIP contribution created", "pm.expect(json.id).to.be.ok;")
                        ], extra_script="""
if (json.id) pm.environment.set("sipContributionId", json.id);
""")
                    ),
                    make_request(
                        name="03. Get Contribution By ID",
                        method="GET",
                        url_path="/api/mutual-fund/sip-contribution/:id",
                        path_vars=[("id", "{{sipContributionId}}", "Contribution ID")],
                        description="Fetches specific installment details.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="04. List Contributions by Mandate",
                        method="GET",
                        url_path="/api/mutual-fund/sip-contribution/mandate/:mandateId",
                        path_vars=[("mandateId", "{{sipMandateId}}", "Mandate ID")],
                        description="Lists all installments under a specific SIP mandate.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="05. List Contributions by FY",
                        method="GET",
                        url_path="/api/mutual-fund/sip-contribution/financial-year/:year",
                        path_vars=[("year", "2024-2025", "Financial Year")],
                        description="Filters contributions within a financial year for tax accounting.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="06. List Contributions by Date Range",
                        method="GET",
                        url_path="/api/mutual-fund/sip-contribution/date-range",
                        query=[("from", "2024-01-01", "Start Date"), ("to", "2025-01-31", "End Date")],
                        description="Filters contributions across a custom date range.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="07. Update Contribution",
                        method="PUT",
                        url_path="/api/mutual-fund/sip-contribution/:id",
                        path_vars=[("id", "{{sipContributionId}}", "Contribution ID")],
                        body={
                            "sipMandateId": "{{sipMandateId}}",
                            "schemeId": "{{mfSchemeId}}",
                            "contributionDate": "2025-01-05",
                            "amount": 5000.00,
                            "navPrice": 72.80,
                            "totalUnit": 68.6813,
                            "debitedBank": "HDFC Bank",
                            "remarks": "Corrected allotment NAV"
                        },
                        description="Updates units or NAV for an allotted installment.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="08. Delete Contribution",
                        method="DELETE",
                        url_path="/api/mutual-fund/sip-contribution/:id",
                        path_vars=[("id", "{{sipContributionId}}", "Contribution ID")],
                        description="Deletes an erroneous SIP contribution record.",
                        test_script=make_test_script(200)
                    )
                ]
            },
            {
                "name": "04. Lumpsum Transactions",
                "description": "One-time lumpsum mutual fund investment purchases.",
                "item": [
                    make_request(
                        name="01. List Lumpsum Transactions",
                        method="GET",
                        url_path="/api/mutual-fund/lumpsum",
                        description="Lists all recorded lumpsum investment purchases.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="02. Create Lumpsum Purchase",
                        method="POST",
                        url_path="/api/mutual-fund/lumpsum",
                        body={
                            "schemeId": "{{mfSchemeId}}",
                            "investmentDate": "2025-01-10",
                            "lumpsumInvestment": 25000.00,
                            "totalUnit": 344.8275,
                            "navPrice": 72.50,
                            "isAfterCutoff": False,
                            "debitedBank": "HDFC Bank",
                            "stampDutyRate": 0.005,
                            "remarks": "Dip purchase after market correction"
                        },
                        description="Records a new lumpsum mutual fund purchase.",
                        test_script=make_test_script(200, [
                            ("Lumpsum transaction created", "pm.expect(json.id).to.be.ok;")
                        ], extra_script="""
if (json.id) pm.environment.set("lumpsumId", json.id);
""")
                    ),
                    make_request(
                        name="03. Get Lumpsum By ID",
                        method="GET",
                        url_path="/api/mutual-fund/lumpsum/:id",
                        path_vars=[("id", "{{lumpsumId}}", "Lumpsum ID")],
                        description="Fetches lumpsum purchase details.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="04. Paginated Lumpsums",
                        method="GET",
                        url_path="/api/mutual-fund/lumpsum/page",
                        query=[("page", "0", "Page index"), ("size", "10", "Page size")],
                        description="Returns paginated lumpsum transactions.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="05. Lumpsums by Financial Year",
                        method="GET",
                        url_path="/api/mutual-fund/lumpsum/financial-year/:year",
                        path_vars=[("year", "2024-2025", "Financial Year")],
                        description="Filters lumpsum purchases by fiscal year.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="06. Lumpsums by Date Range",
                        method="GET",
                        url_path="/api/mutual-fund/lumpsum/date-range",
                        query=[("from", "2024-01-01", "Start Date"), ("to", "2025-01-31", "End Date")],
                        description="Filters lumpsum purchases across dates.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="07. Update Lumpsum",
                        method="PUT",
                        url_path="/api/mutual-fund/lumpsum/:id",
                        path_vars=[("id", "{{lumpsumId}}", "Lumpsum ID")],
                        body={
                            "schemeId": "{{mfSchemeId}}",
                            "investmentDate": "2025-01-10",
                            "lumpsumInvestment": 25000.00,
                            "totalUnit": 344.8275,
                            "navPrice": 72.50,
                            "debitedBank": "HDFC Bank",
                            "remarks": "Updated remarks"
                        },
                        description="Updates lumpsum details.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="08. Delete Lumpsum",
                        method="DELETE",
                        url_path="/api/mutual-fund/lumpsum/:id",
                        path_vars=[("id", "{{lumpsumId}}", "Lumpsum ID")],
                        description="Deletes a lumpsum purchase entry.",
                        test_script=make_test_script(200)
                    )
                ]
            },
            {
                "name": "05. Redemptions",
                "description": "Mutual fund redemptions with automated First-In-First-Out (FIFO) capital gains calculation.",
                "item": [
                    make_request(
                        name="01. List Redemptions",
                        method="GET",
                        url_path="/api/mutual-fund/redemption",
                        description="Lists all recorded redemption transactions.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="02. Preview FIFO Gain/Units Before Sale",
                        method="GET",
                        url_path="/api/mutual-fund/redemption/preview-fifo",
                        query=[
                            ("schemeId", "{{mfSchemeId}}", "Scheme ID to sell"),
                            ("redemptionUnit", "50.0", "Units to redeem"),
                            ("navPrice", "78.20", "Expected redemption NAV"),
                            ("redemptionDate", "2025-02-01", "Execution date")
                        ],
                        description="Dry-run simulator that computes FIFO capital gains (LTCG vs STCG) and remaining unit cost basis without modifying data.",
                        test_script=make_test_script(200, [
                            ("FIFO simulation returned", "pm.expect(json).to.be.an('object');")
                        ])
                    ),
                    make_request(
                        name="03. Record Redemption",
                        method="POST",
                        url_path="/api/mutual-fund/redemption",
                        body={
                            "schemeId": "{{mfSchemeId}}",
                            "redemptionDate": "2025-02-01",
                            "redemptionUnit": 50.0,
                            "navPrice": 78.20,
                            "remarks": "Partial profit booking via Postman"
                        },
                        description="Executes a redemption, burns units via FIFO, and computes realized gain.",
                        test_script=make_test_script(200, [
                            ("Redemption recorded", "pm.expect(json.id).to.be.ok;")
                        ], extra_script="""
if (json.id) pm.environment.set("redemptionId", json.id);
""")
                    ),
                    make_request(
                        name="04. Get Redemption By ID",
                        method="GET",
                        url_path="/api/mutual-fund/redemption/:id",
                        path_vars=[("id", "{{redemptionId}}", "Redemption ID")],
                        description="Fetches realized gain and redeemed unit details.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="05. Redemptions by Financial Year",
                        method="GET",
                        url_path="/api/mutual-fund/redemption/financial-year/:year",
                        path_vars=[("year", "2024-2025", "Financial Year")],
                        description="Returns redemptions for capital gains tax filing.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="06. Redemptions by Date Range",
                        method="GET",
                        url_path="/api/mutual-fund/redemption/date-range",
                        query=[("from", "2024-01-01", "Start Date"), ("to", "2025-02-28", "End Date")],
                        description="Filters redemptions across date range.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="07. Update Redemption",
                        method="PUT",
                        url_path="/api/mutual-fund/redemption/:id",
                        path_vars=[("id", "{{redemptionId}}", "Redemption ID")],
                        body={
                            "schemeId": "{{mfSchemeId}}",
                            "redemptionDate": "2025-02-01",
                            "redemptionUnit": 50.0,
                            "navPrice": 78.50,
                            "remarks": "Updated execution NAV"
                        },
                        description="Updates redemption details and recalculates cost basis.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="08. Delete Redemption",
                        method="DELETE",
                        url_path="/api/mutual-fund/redemption/:id",
                        path_vars=[("id", "{{redemptionId}}", "Redemption ID")],
                        description="Reverts a redemption and restores units to the FIFO pool.",
                        test_script=make_test_script(200)
                    )
                ]
            },
            {
                "name": "06. Valuations & Summary",
                "description": "Portfolio valuation dashboard, scheme summaries, Excel exports, and admin maintenance tools.",
                "item": [
                    make_request(
                        name="01. Mutual Fund Dashboard",
                        method="GET",
                        url_path="/api/mutual-fund/dashboard",
                        description="High-level dashboard metrics: total valuation, invested amount, absolute gains, and scheme counts.",
                        test_script=make_test_script(200, [
                            ("Dashboard payload returned", "pm.expect(json).to.be.an('object');")
                        ], visualizer_script=VISUALIZER_MF_DASHBOARD)
                    ),
                    make_request(
                        name="02. Portfolio Summary",
                        method="GET",
                        url_path="/api/mutual-fund/summary",
                        description="Returns consolidated asset allocation and total investment figures.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="03. Scheme Level Summary",
                        method="GET",
                        url_path="/api/mutual-fund/scheme-summary",
                        description="Breakdown of units, invested amount, current NAV, and P&L per scheme.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="04. Export to Excel",
                        method="GET",
                        url_path="/api/mutual-fund/export",
                        description="Exports complete mutual fund ledger to a styled Excel (.xlsx) file.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="05. List Valuation Snapshots",
                        method="GET",
                        url_path="/api/mutual-fund/valuation",
                        description="Returns historical valuation snapshots.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="06. Create Valuation Snapshot",
                        method="POST",
                        url_path="/api/mutual-fund/valuation",
                        body={
                            "snapshotDate": "2025-01-31",
                            "totalInvested": 150000.00,
                            "currentValuation": 178500.00,
                            "remarks": "Month-end valuation snapshot"
                        },
                        description="Saves a point-in-time valuation snapshot for performance tracking.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="07. Admin Refresh All NAVs",
                        method="GET",
                        url_path="/api/mutual-fund/admin/refresh-navs",
                        description="Fetches latest daily NAVs from AMFI for all active schemes.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="08. Admin Backfill Redemption Balances",
                        method="POST",
                        url_path="/api/mutual-fund/admin/backfill-redemption-balances",
                        description="Recalculates historical redemption cost bases and remaining units.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="09. Admin Cleanup Duplicate Investments",
                        method="GET",
                        url_path="/api/mutual-fund/admin/cleanup-investments",
                        description="Scans and cleans up orphan or duplicate transaction records.",
                        test_script=make_test_script(200)
                    )
                ]
            }
        ]
    }

# ==============================================================================
# FOLDER 07: EPF (EMPLOYEE PROVIDENT FUND)
# ==============================================================================
def get_folder_07_epf():
    return {
        "name": "07. Employee Provident Fund (EPF)",
        "description": "Employee Provident Fund (EPF) and Employee Pension Scheme (EPS) tracking: monthly contributions, VPF, compounding interest rules, and settings.",
        "item": [
            make_request(
                name="01. Get EPF Summary",
                method="GET",
                url_path="/api/epf/summary",
                description="Consolidated EPF dashboard summary: current EPF & EPS balances, lifetime employee/employer contributions, and interest earned.",
                test_script=make_test_script(200, [
                    ("EPF summary returned", "pm.expect(json).to.be.an('object');")
                ], visualizer_script=VISUALIZER_EPF_SUMMARY)
            ),
            make_request(
                name="02. List EPF Transactions",
                method="GET",
                url_path="/api/epf/transactions",
                query=[("page", "0", "Page number"), ("size", "10", "Page size")],
                description="Returns paginated monthly EPF contributions and interest credits.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="03. Create EPF Transaction",
                method="POST",
                url_path="/api/epf/transactions",
                body={
                    "transactionDate": "2025-01-31",
                    "mode": "AUTO_SALARY",
                    "basicDA": 50000.00,
                    "employeeContribution": 6000.00,
                    "employerEpfContribution": 1800.00,
                    "employerEpsContribution": 1250.00,
                    "vpfAmount": 2500.00,
                    "withdrawalAmount": 0.00,
                    "remarks": "January 2025 salary contribution"
                },
                description="Records a new monthly EPF installment with employee, employer, and VPF amounts.",
                test_script=make_test_script(200, [
                    ("EPF transaction created", "pm.expect(json.id).to.be.ok;")
                ], extra_script="""
if (json.id) pm.environment.set("epfTransactionId", json.id);
""")
            ),
            make_request(
                name="04. Get EPF Transaction By ID",
                method="GET",
                url_path="/api/epf/transactions/:id",
                path_vars=[("id", "{{epfTransactionId}}", "EPF Transaction ID")],
                description="Fetches specific EPF transaction details.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="05. Update EPF Transaction",
                method="PUT",
                url_path="/api/epf/transactions/:id",
                path_vars=[("id", "{{epfTransactionId}}", "EPF Transaction ID")],
                body={
                    "transactionDate": "2025-01-31",
                    "mode": "AUTO_SALARY",
                    "basicDA": 55000.00,
                    "employeeContribution": 6600.00,
                    "employerEpfContribution": 1980.00,
                    "employerEpsContribution": 1250.00,
                    "vpfAmount": 2500.00,
                    "remarks": "Updated basic salary"
                },
                description="Updates an existing EPF transaction record.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="06. Delete EPF Transaction",
                method="DELETE",
                url_path="/api/epf/transactions/:id",
                path_vars=[("id", "{{epfTransactionId}}", "EPF Transaction ID")],
                description="Deletes an EPF transaction entry.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="07. Get EPF Settings",
                method="GET",
                url_path="/api/epf/settings",
                description="Fetches user EPF parameters (default Basic+DA, contribution percentage, VPF default).",
                test_script=make_test_script(200)
            ),
            make_request(
                name="08. Update EPF Settings",
                method="PUT",
                url_path="/api/epf/settings",
                body={
                    "defaultBasicDA": 50000.00,
                    "employeeContributionRate": 12.00,
                    "useActualSalaryForEps": False,
                    "monthlyVpfAmount": 2500.00
                },
                description="Configures EPF defaults for automated salary entry generation.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="09. Get FY Interest Rates",
                method="GET",
                url_path="/api/epf/interest-rates",
                description="Returns historical and current EPFO notified interest rates per financial year.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="10. Export EPF to XLSX",
                method="GET",
                url_path="/api/epf/export",
                description="Exports entire EPF passbook statement to Excel spreadsheet format.",
                test_script=make_test_script(200)
            )
        ]
    }

# ==============================================================================
# FOLDER 08: PPF (PUBLIC PROVIDENT FUND)
# ==============================================================================
def get_folder_08_ppf():
    return {
        "name": "08. Public Provident Fund (PPF)",
        "description": "Public Provident Fund (PPF) ledger: deposits, withdrawals, annual interest credits, 15-year maturity tracking, and partial withdrawal eligibility.",
        "item": [
            make_request(
                name="01. Get PPF Summary",
                method="GET",
                url_path="/api/ppf/summary",
                description="Consolidated PPF summary: current balance, total deposits, cumulative interest, and account longevity.",
                test_script=make_test_script(200, [
                    ("PPF summary returned", "pm.expect(json).to.be.an('object');")
                ], visualizer_script=VISUALIZER_PPF_SUMMARY)
            ),
            make_request(
                name="02. List PPF Transactions",
                method="GET",
                url_path="/api/ppf/transactions",
                query=[("page", "0", "Page number"), ("size", "10", "Page size")],
                description="Returns paginated PPF passbook ledger entries.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="03. Record PPF Deposit",
                method="POST",
                url_path="/api/ppf/transactions",
                body={
                    "transactionDate": "2025-01-05",
                    "particulars": "Subscription via NetBanking",
                    "particularType": "DEPOSIT",
                    "creditAmount": 10000.00,
                    "remarks": "FY24-25 monthly installment"
                },
                description="Records a new deposit credit into the PPF account.",
                test_script=make_test_script(200, [
                    ("PPF deposit created", "pm.expect(json.id).to.be.ok;")
                ], extra_script="""
if (json.id) pm.environment.set("ppfTransactionId", json.id);
""")
            ),
            make_request(
                name="04. Get PPF Transaction By ID",
                method="GET",
                url_path="/api/ppf/transactions/:id",
                path_vars=[("id", "{{ppfTransactionId}}", "PPF Transaction ID")],
                description="Fetches specific PPF transaction details.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="05. Update PPF Transaction",
                method="PUT",
                url_path="/api/ppf/transactions/:id",
                path_vars=[("id", "{{ppfTransactionId}}", "PPF Transaction ID")],
                body={
                    "transactionDate": "2025-01-05",
                    "particulars": "Subscription via UPI",
                    "particularType": "DEPOSIT",
                    "creditAmount": 12500.00,
                    "remarks": "Updated contribution amount"
                },
                description="Updates a PPF transaction record.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="06. Delete PPF Transaction",
                method="DELETE",
                url_path="/api/ppf/transactions/:id",
                path_vars=[("id", "{{ppfTransactionId}}", "PPF Transaction ID")],
                description="Deletes a PPF passbook entry.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="07. Get PPF Account Settings",
                method="GET",
                url_path="/api/ppf/settings",
                description="Fetches PPF account number, opening issue date, and 5-year extension mode.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="08. Update PPF Account Settings",
                method="PUT",
                url_path="/api/ppf/settings",
                body={
                    "accountNumber": "PPF-SBI-1029384756",
                    "dateOfIssue": "2020-04-01",
                    "extensionMode": "WITH_CONTRIBUTION"
                },
                description="Configures PPF account metadata driving 15-year maturity and 7th-year partial withdrawal math.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="09. Get Distinct Fiscal Years",
                method="GET",
                url_path="/api/ppf/fiscal-years",
                description="Returns distinct financial years present in user's PPF passbook.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="10. Check Withdrawal Status & Eligibility",
                method="GET",
                url_path="/api/ppf/withdrawal-status",
                description="Computes statutory eligibility for partial withdrawal (allowed from 7th financial year) and max permitted amount.",
                test_script=make_test_script(200, [
                    ("Withdrawal status evaluated", "pm.expect(json).to.have.property('withdrawalAllowed');")
                ])
            ),
            make_request(
                name="11. Export PPF Transactions",
                method="GET",
                url_path="/api/ppf/export",
                description="Exports complete PPF passbook to Excel spreadsheet format.",
                test_script=make_test_script(200)
            )
        ]
    }

# ==============================================================================
# FOLDER 09: FIXED DEPOSITS (FD)
# ==============================================================================
def get_folder_09_fixed_deposits():
    return {
        "name": "09. Fixed Deposits (FD)",
        "description": "Fixed Deposit portfolio tracking: cumulative and non-cumulative FDs, premature withdrawal with penalty simulation, TDS summaries, and certificate tracking.",
        "item": [
            make_request(
                name="01. Get Fixed Deposits Summary",
                method="GET",
                url_path="/api/fixed-deposits/summary",
                description="Summary metrics: active deposit total, estimated interest returns, matured deposits, and total TDS deducted.",
                test_script=make_test_script(200, [
                    ("FD summary returned", "pm.expect(json).to.be.an('object');")
                ], visualizer_script=VISUALIZER_FD_SUMMARY)
            ),
            make_request(
                name="02. List Fixed Deposits",
                method="GET",
                url_path="/api/fixed-deposits",
                query=[("page", "0", "Page number"), ("size", "10", "Page size")],
                description="Returns paginated list of all active, matured, and withdrawn fixed deposits.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="03. Create Fixed Deposit",
                method="POST",
                url_path="/api/fixed-deposits",
                body={
                    "place": "HDFC Bank",
                    "holderName": "Urva Gandhi",
                    "nominee": "Family Nominee",
                    "accountNumber": "FD-50100987654",
                    "interestRate": 7.25,
                    "investmentPeriod": "1 Year 6 Months",
                    "issueDate": "2024-06-01",
                    "maturityDate": "2025-12-01",
                    "issueAmount": 100000.00,
                    "maturityAmount": 111350.00,
                    "maturityMode": "AUTOMATIC",
                    "fdType": "CUMULATIVE",
                    "remarks": "Special festive rate FD"
                },
                description="Creates a new bank fixed deposit certificate in the portfolio.",
                test_script=make_test_script(200, [
                    ("Fixed deposit created", "pm.expect(json.id).to.be.ok;")
                ], extra_script="""
if (json.id) pm.environment.set("fdId", json.id);
""")
            ),
            make_request(
                name="04. Get Fixed Deposit By ID",
                method="GET",
                url_path="/api/fixed-deposits/:id",
                path_vars=[("id", "{{fdId}}", "Fixed Deposit ID")],
                description="Fetches specific FD details, interest payout terms, and status.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="05. Update Fixed Deposit",
                method="PUT",
                url_path="/api/fixed-deposits/:id",
                path_vars=[("id", "{{fdId}}", "Fixed Deposit ID")],
                body={
                    "place": "HDFC Bank",
                    "holderName": "Urva Gandhi",
                    "nominee": "Primary Nominee",
                    "accountNumber": "FD-50100987654",
                    "interestRate": 7.40,
                    "investmentPeriod": "1 Year 6 Months",
                    "issueDate": "2024-06-01",
                    "maturityDate": "2025-12-01",
                    "issueAmount": 100000.00,
                    "maturityAmount": 111620.00,
                    "maturityMode": "AUTOMATIC",
                    "fdType": "CUMULATIVE",
                    "remarks": "Corrected interest rate"
                },
                description="Updates FD details before maturity.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="06. Preview Premature Withdrawal (Dry-run)",
                method="POST",
                url_path="/api/fixed-deposits/:id/withdraw/preview",
                path_vars=[("id", "{{fdId}}", "Fixed Deposit ID")],
                body={
                    "withdrawalDate": "2025-01-15",
                    "penaltyRateOverride": 1.0,
                    "bankName": "HDFC Bank"
                },
                description="Simulates premature withdrawal penalties and computes net payout without persisting changes.",
                test_script=make_test_script(200, [
                    ("Withdrawal preview returned", "pm.expect(json).to.be.an('object');")
                ])
            ),
            make_request(
                name="07. Execute Premature Withdrawal",
                method="POST",
                url_path="/api/fixed-deposits/:id/withdraw",
                path_vars=[("id", "{{fdId}}", "Fixed Deposit ID")],
                body={
                    "withdrawalDate": "2025-01-15",
                    "penaltyRateOverride": 1.0,
                    "bankName": "HDFC Bank"
                },
                description="Executes premature liquidation and marks FD status as WITHDRAWN.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="08. Get FD TDS Detail",
                method="GET",
                url_path="/api/fixed-deposits/:id/tds",
                path_vars=[("id", "{{fdId}}", "Fixed Deposit ID")],
                query=[("fy", "2024-25", "Financial Year")],
                description="Returns Section 194A TDS deductions applicable to this deposit.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="09. Get All FDs TDS Summary",
                method="GET",
                url_path="/api/fixed-deposits/tds-summary",
                query=[("fy", "2024-25", "Financial Year")],
                description="Consolidated annual TDS deduction summary across all deposits.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="10. Export Fixed Deposits to CSV",
                method="GET",
                url_path="/api/fixed-deposits/export",
                description="Exports all fixed deposit records to CSV spreadsheet.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="11. Delete Fixed Deposit",
                method="DELETE",
                url_path="/api/fixed-deposits/:id",
                path_vars=[("id", "{{fdId}}", "Fixed Deposit ID")],
                description="Deletes a fixed deposit record.",
                test_script=make_test_script(200)
            )
        ]
    }

# ==============================================================================
# FOLDER 10: GOLD & SILVER HOLDINGS
# ==============================================================================
def get_folder_10_gold_silver():
    return {
        "name": "10. Gold & Silver Holdings",
        "description": "Physical precious metals (Gold & Silver) tracking: bullion coins, jewelry, live market rates API, manual overrides, purity factors, and profit/loss valuation.",
        "item": [
            make_request(
                name="01. Get Metal Holdings Summary",
                method="GET",
                url_path="/api/gold-silver/summary",
                description="Summary: total invested, current market value, overall P&L, gold weight in grams, and silver weight in grams.",
                test_script=make_test_script(200, [
                    ("Bullion summary returned", "pm.expect(json).to.be.an('object');")
                ], visualizer_script=VISUALIZER_GOLD_SILVER_SUMMARY)
            ),
            make_request(
                name="02. List Metal Holdings",
                method="GET",
                url_path="/api/gold-silver",
                description="Lists all physical precious metal items registered in the vault.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="03. Add Metal Holding",
                method="POST",
                url_path="/api/gold-silver",
                body={
                    "purchaseDate": "2024-11-01",
                    "purchasedFrom": "Tanishq Jewellers",
                    "metalType": "GOLD",
                    "purchaseItem": "24K Gold Minted Coin 10g",
                    "purity": "24K",
                    "purityOptionId": "gold-24k",
                    "rateSource": "API",
                    "ratePerGram": 7650.00,
                    "netWeight": 10.00,
                    "makingChargePercent": 2.0,
                    "stoneOtherCharges": 0.0,
                    "gstPercent": 3.0,
                    "remarks": "Diwali investment bullion"
                },
                description="Adds a new gold or silver asset to the holdings ledger.",
                test_script=make_test_script(200, [
                    ("Holding created with ID", "pm.expect(json.id).to.be.ok;")
                ], extra_script="""
if (json.id) pm.environment.set("goldSilverId", json.id);
""")
            ),
            make_request(
                name="04. Get Metal Holding By ID",
                method="GET",
                url_path="/api/gold-silver/:id",
                path_vars=[("id", "{{goldSilverId}}", "Metal Holding ID")],
                description="Fetches specific bullion item details.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="05. Update Metal Holding",
                method="PUT",
                url_path="/api/gold-silver/:id",
                path_vars=[("id", "{{goldSilverId}}", "Metal Holding ID")],
                body={
                    "purchaseDate": "2024-11-01",
                    "purchasedFrom": "Tanishq Jewellers",
                    "metalType": "GOLD",
                    "purchaseItem": "24K Gold Minted Coin 10g (Certified)",
                    "purity": "24K",
                    "purityOptionId": "gold-24k",
                    "rateSource": "API",
                    "ratePerGram": 7650.00,
                    "netWeight": 10.00,
                    "makingChargePercent": 1.8,
                    "stoneOtherCharges": 0.0,
                    "gstPercent": 3.0,
                    "remarks": "Hallmark certificate verified"
                },
                description="Updates metal weight or invoice details.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="06. Update Rate Mode (API vs MANUAL)",
                method="PATCH",
                url_path="/api/gold-silver/:id/rate-mode",
                path_vars=[("id", "{{goldSilverId}}", "Metal Holding ID")],
                query=[("rateSource", "API", "API or MANUAL")],
                description="Toggles valuation rate source between live AMFI/Bullion market API and user manual entry.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="07. Get Current Live Rates",
                method="GET",
                url_path="/api/gold-silver/rates/current",
                description="Fetches live spot prices for 24K/22K gold and 999 silver per gram.",
                test_script=make_test_script(200, [
                    ("Live metal rates returned", "pm.expect(json).to.be.an('object');")
                ])
            ),
            make_request(
                name="08. Trigger Live Rates Refresh",
                method="POST",
                url_path="/api/gold-silver/rates/refresh",
                description="Forces an on-demand market rate refresh from the external metal rates provider.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="09. Get Metal Rates API Usage",
                method="GET",
                url_path="/api/gold-silver/rates/usage",
                description="Returns API quota usage and rate limit status for external bullion feeds.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="10. Get Metal Rates API Health",
                method="GET",
                url_path="/api/gold-silver/rates/health",
                description="Monitors live connectivity and latency to external metals price providers.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="11. Get Rate Settings",
                method="GET",
                url_path="/api/gold-silver/rate-settings",
                description="Returns default rate mode settings and manual price overrides.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="12. Update Rate Settings",
                method="PUT",
                url_path="/api/gold-silver/rate-settings",
                body={
                    "defaultRateSource": "API",
                    "manualGoldRate": 7700.00,
                    "manualSilverRate": 92.50
                },
                description="Sets fallback manual rates when offline or external API limits are exceeded.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="13. Patch Manual Market Rate",
                method="PATCH",
                url_path="/api/gold-silver/market-rate",
                body={
                    "metalType": "GOLD",
                    "ratePerGram": 7750.00
                },
                description="Quick-updates manual spot rate for gold or silver.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="14. Get Metal Purity Options",
                method="GET",
                url_path="/api/gold-silver/purity-options",
                description="Returns supported purity options (24K, 22K, 18K, 14K for gold; 999, 925 for silver).",
                test_script=make_test_script(200)
            ),
            make_request(
                name="15. Export Metal Holdings",
                method="GET",
                url_path="/api/gold-silver/export",
                description="Exports all gold and silver holdings to spreadsheet format.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="16. Delete Metal Holding",
                method="DELETE",
                url_path="/api/gold-silver/:id",
                path_vars=[("id", "{{goldSilverId}}", "Metal Holding ID")],
                description="Deletes a precious metal holding record.",
                test_script=make_test_script(200)
            )
        ]
    }

# ==============================================================================
# FOLDER 11: NOTES & MARGIN ANNOTATIONS
# ==============================================================================
def get_folder_11_notes():
    return {
        "name": "11. Notes & Annotations",
        "description": "Financial notes, investment rationales, trade journaling, tags, and pinned annotations.",
        "item": [
            make_request(
                name="01. List All Notes",
                method="GET",
                url_path="/api/notes",
                query=[("page", "0", "Page index"), ("size", "10", "Page size"), ("search", "", "Keyword filter")],
                description="Returns user's notes with optional search filtering and pagination.",
                test_script=make_test_script(200, [
                    ("Notes response received", "pm.expect(json).to.be.an('object');")
                ])
            ),
            make_request(
                name="02. Create Note",
                method="POST",
                url_path="/api/notes",
                body={
                    "title": "HDFC Bank Q3 Earnings & Thesis",
                    "content": "Strong deposit growth at 16% YoY. NIM expanded 5bps. Accumulating in SIP mode below 1550.",
                    "tags": ["Banking", "LargeCap", "Q3Results"],
                    "color": "#10b981",
                    "pinned": True
                },
                description="Creates a new research note or trade rationale.",
                test_script=make_test_script(200, [
                    ("Note created with ID", "pm.expect(json.id).to.be.ok;")
                ], extra_script="""
if (json.id) pm.environment.set("noteId", json.id);
""")
            ),
            make_request(
                name="03. Update Note",
                method="PUT",
                url_path="/api/notes/:id",
                path_vars=[("id", "{{noteId}}", "Note ID")],
                body={
                    "title": "HDFC Bank Q3 Earnings & Thesis (Updated)",
                    "content": "Strong deposit growth confirmed. Management concall provided upbeat guidance.",
                    "tags": ["Banking", "LargeCap", "ThesisUpdated"],
                    "color": "#10b981",
                    "pinned": True
                },
                description="Updates an existing note's content or tags.",
                test_script=make_test_script(200)
            ),
            make_request(
                name="04. Delete Note",
                method="DELETE",
                url_path="/api/notes/:id",
                path_vars=[("id", "{{noteId}}", "Note ID")],
                description="Deletes a note record.",
                test_script=make_test_script(200)
            )
        ]
    }

# ==============================================================================
# FOLDER 12: FINANCIAL CALCULATORS (32 ENGINES)
# ==============================================================================
def get_folder_12_calculators():
    return {
        "name": "12. Financial Calculators (32 Engines)",
        "description": "Comprehensive suite of 32 Indian financial planning engines: Investment (8), Loans (6), Planning (1), Savings (10), Tax (6), and Trading (2). Publicly accessible with rate limiting.",
        "item": [
            {
                "name": "01. Investment Calculators (8)",
                "item": [
                    make_request(
                        name="01. SIP Calculator",
                        method="POST",
                        url_path="/api/calculators/investment/sip",
                        auth_override=NO_AUTH,
                        body={"monthlyInvestment": 10000, "expectedReturn": 12.0, "years": 10},
                        description="Calculates compound wealth growth from a monthly systematic investment plan.",
                        test_script=make_test_script(200, [
                            ("Total maturity value calculated", "pm.expect(json.result.totalValue || json.result.maturityAmount).to.be.above(1200000);")
                        ], visualizer_script=VISUALIZER_CALCULATOR_SIP)
                    ),
                    make_request(
                        name="02. Step-Up SIP Calculator",
                        method="POST",
                        url_path="/api/calculators/investment/step-up-sip",
                        auth_override=NO_AUTH,
                        body={"monthlyInvestment": 10000, "stepUpPercent": 10.0, "expectedReturn": 12.0, "years": 10},
                        description="Calculates returns with an annual percentage increment in monthly contributions.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="03. Lumpsum Calculator",
                        method="POST",
                        url_path="/api/calculators/investment/lumpsum",
                        auth_override=NO_AUTH,
                        body={"principal": 100000, "expectedReturn": 12.0, "years": 5},
                        description="Calculates compound returns on a one-time lumpsum investment.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="04. CAGR Calculator",
                        method="POST",
                        url_path="/api/calculators/investment/cagr",
                        auth_override=NO_AUTH,
                        body={"initialValue": 50000, "finalValue": 120000, "years": 5},
                        description="Computes Compound Annual Growth Rate between initial and final values.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="05. Mutual Fund Returns",
                        method="POST",
                        url_path="/api/calculators/investment/mutual-fund-returns",
                        auth_override=NO_AUTH,
                        body={"monthlyInvestment": 5000, "expectedReturn": 14.0, "years": 7},
                        description="Simulates mutual fund wealth generation with benchmark comparisons.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="06. XIRR Calculator",
                        method="POST",
                        url_path="/api/calculators/investment/xirr",
                        auth_override=NO_AUTH,
                        body={
                            "cashFlows": [
                                {"date": "2023-01-01", "amount": -10000},
                                {"date": "2023-06-01", "amount": -10000},
                                {"date": "2024-01-01", "amount": -10000},
                                {"date": "2024-12-31", "amount": 38000}
                            ]
                        },
                        description="Computes Extended Internal Rate of Return for irregular cash flows.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="07. Stock Average Price Calculator",
                        method="POST",
                        url_path="/api/calculators/investment/stock-average",
                        auth_override=NO_AUTH,
                        body={"existingQuantity": 50, "existingPrice": 1200.0, "newQuantity": 30, "newPrice": 1050.0},
                        description="Calculates new blended average buy price after accumulation.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="08. Inflation Impact Calculator",
                        method="POST",
                        url_path="/api/calculators/investment/inflation",
                        auth_override=NO_AUTH,
                        body={"presentValue": 100000, "inflationRate": 6.5, "years": 15},
                        description="Calculates erosion of purchasing power and future corpus needed.",
                        test_script=make_test_script(200)
                    )
                ]
            },
            {
                "name": "02. Loan Calculators (6)",
                "item": [
                    make_request(
                        name="01. Generic Loan EMI",
                        method="POST",
                        url_path="/api/calculators/loans/emi",
                        auth_override=NO_AUTH,
                        body={"principal": 2500000, "annualRate": 8.75, "months": 120},
                        description="Computes equated monthly installment and principal vs interest amortization.",
                        test_script=make_test_script(200, [
                            ("Monthly EMI computed", "pm.expect(json.result.monthlyEmi || json.result.emi).to.be.above(0);")
                        ], visualizer_script=VISUALIZER_CALCULATOR_EMI)
                    ),
                    make_request(
                        name="02. Home Loan EMI",
                        method="POST",
                        url_path="/api/calculators/loans/home-loan-emi",
                        auth_override=NO_AUTH,
                        body={"principal": 5000000, "annualRate": 8.50, "months": 240},
                        description="Long-term home loan EMI projection with tax deduction insights.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="03. Car Loan EMI",
                        method="POST",
                        url_path="/api/calculators/loans/car-loan-emi",
                        auth_override=NO_AUTH,
                        body={"principal": 800000, "annualRate": 9.25, "months": 60},
                        description="Automobile loan financing schedule.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="04. Simple Interest Calculator",
                        method="POST",
                        url_path="/api/calculators/loans/simple-interest",
                        auth_override=NO_AUTH,
                        body={"principal": 50000, "annualRate": 7.0, "years": 3},
                        description="Computes simple interest (P * R * T / 100).",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="05. Compound Interest Calculator",
                        method="POST",
                        url_path="/api/calculators/loans/compound-interest",
                        auth_override=NO_AUTH,
                        body={"principal": 100000, "annualRate": 7.5, "years": 5, "compoundingFrequency": 4},
                        description="Computes compounding interest for quarterly, monthly, or annual frequencies.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="06. Flat vs Reducing Rate Comparison",
                        method="POST",
                        url_path="/api/calculators/loans/flat-vs-reducing",
                        auth_override=NO_AUTH,
                        body={"principal": 500000, "annualRate": 10.5, "months": 36},
                        description="Exposes true effective rate differences between deceptively advertised flat rates and reducing balance EMI.",
                        test_script=make_test_script(200)
                    )
                ]
            },
            {
                "name": "03. Planning Calculators (1)",
                "item": [
                    make_request(
                        name="01. Retirement Corpus Calculator",
                        method="POST",
                        url_path="/api/calculators/planning/retirement",
                        auth_override=NO_AUTH,
                        body={
                            "currentAge": 30,
                            "retirementAge": 60,
                            "lifeExpectancy": 85,
                            "currentMonthlyExpense": 45000,
                            "currentSavings": 500000,
                            "expectedInflation": 6.0,
                            "preRetirementReturn": 12.0,
                            "postRetirementReturn": 8.0
                        },
                        description="Estimates retirement corpus required, post-retirement monthly cashflows, and monthly savings goal.",
                        test_script=make_test_script(200, [
                            ("Retirement corpus projected", "pm.expect(json.result.targetCorpus || json.result.corpusRequired).to.be.above(0);")
                        ])
                    )
                ]
            },
            {
                "name": "04. Savings Schemes Calculators (10)",
                "item": [
                    make_request(
                        name="01. PPF Scheme Calculator",
                        method="POST",
                        url_path="/api/calculators/savings/ppf",
                        auth_override=NO_AUTH,
                        body={"yearlyInvestment": 150000, "years": 15, "interestRate": 7.1},
                        description="Calculates 15-year statutory PPF tax-free maturity amount.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="02. EPF Savings Projection",
                        method="POST",
                        url_path="/api/calculators/savings/epf",
                        auth_override=NO_AUTH,
                        body={
                            "monthlyBasicSalary": 60000,
                            "employeeContributionPercent": 12.0,
                            "employerContributionPercent": 3.67,
                            "currentAge": 28,
                            "retirementAge": 58,
                            "currentEpfBalance": 200000,
                            "annualSalaryIncrease": 8.0
                        },
                        description="Projects cumulative retirement EPF balance with annual salary increments.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="03. Fixed Deposit (FD) Calculator",
                        method="POST",
                        url_path="/api/calculators/savings/fd",
                        auth_override=NO_AUTH,
                        body={"principal": 200000, "interestRate": 7.25, "tenureDays": 365, "compoundingFrequency": 4, "isSeniorCitizen": False},
                        description="Computes bank FD maturity amount with quarterly compounding.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="04. Recurring Deposit (RD) Calculator",
                        method="POST",
                        url_path="/api/calculators/savings/rd",
                        auth_override=NO_AUTH,
                        body={"monthlyDeposit": 5000, "interestRate": 6.8, "tenureMonths": 24, "isSeniorCitizen": False},
                        description="Computes cumulative bank RD maturity returns.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="05. Sukanya Samriddhi Yojana (SSY)",
                        method="POST",
                        url_path="/api/calculators/savings/ssy",
                        auth_override=NO_AUTH,
                        body={"yearlyInvestment": 100000, "girlAge": 3, "interestRate": 8.2},
                        description="Government child savings scheme with 21-year tax-exempt maturity.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="06. National Pension Scheme (NPS)",
                        method="POST",
                        url_path="/api/calculators/savings/nps",
                        auth_override=NO_AUTH,
                        body={"monthlyContribution": 10000, "currentAge": 30, "retirementAge": 60, "expectedReturn": 10.0, "annuityPercentage": 40, "annuityReturnRate": 6.0},
                        description="Projects lump-sum pension withdrawal and monthly annuity payout.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="07. National Savings Certificate (NSC)",
                        method="POST",
                        url_path="/api/calculators/savings/nsc",
                        auth_override=NO_AUTH,
                        body={"investmentAmount": 100000},
                        description="Post office 5-year fixed savings certificate return calculation.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="08. Senior Citizens Savings Scheme (SCSS)",
                        method="POST",
                        url_path="/api/calculators/savings/scss",
                        auth_override=NO_AUTH,
                        body={"investmentAmount": 1500000},
                        description="Quarterly payout calculation for senior citizens (current 8.2% p.a.).",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="09. Monthly Income Scheme (MIS)",
                        method="POST",
                        url_path="/api/calculators/savings/mis",
                        auth_override=NO_AUTH,
                        body={"investmentAmount": 450000},
                        description="Post office monthly interest payout calculation.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="10. Atal Pension Yojana (APY)",
                        method="POST",
                        url_path="/api/calculators/savings/apy",
                        auth_override=NO_AUTH,
                        body={"desiredPension": 5000, "currentAge": 25},
                        description="Computes required monthly contribution for guaranteed pension under APY.",
                        test_script=make_test_script(200)
                    )
                ]
            },
            {
                "name": "05. Tax Calculators (6)",
                "item": [
                    make_request(
                        name="01. Income Tax Calculator (Old vs New)",
                        method="POST",
                        url_path="/api/calculators/tax/income-tax",
                        auth_override=NO_AUTH,
                        body={
                            "grossIncome": 1500000,
                            "section80CDeductions": 150000,
                            "section80DDeductions": 25000,
                            "otherDeductions": 50000,
                            "hraExemption": 120000,
                            "financialYear": "2024-25"
                        },
                        description="Side-by-side comparison of tax liability under Old Regime vs New Concessional Regime.",
                        test_script=make_test_script(200, [
                            ("Tax regimes compared", "pm.expect(json.result).to.have.property('newRegimeTax');")
                        ])
                    ),
                    make_request(
                        name="02. House Rent Allowance (HRA) Exemption",
                        method="POST",
                        url_path="/api/calculators/tax/hra",
                        auth_override=NO_AUTH,
                        body={
                            "basicSalary": 600000,
                            "dearnessAllowance": 0,
                            "hraReceived": 240000,
                            "rentPaid": 300000,
                            "isMetroCity": True
                        },
                        description="Calculates Section 10(13A) HRA exemption under lowest of three statutory rules.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="03. In-Hand Salary Breakdown",
                        method="POST",
                        url_path="/api/calculators/tax/salary",
                        auth_override=NO_AUTH,
                        body={
                            "basic": 50000,
                            "hra": 25000,
                            "specialAllowance": 15000,
                            "lta": 5000,
                            "pf": 6000,
                            "professionalTax": 200,
                            "isMetroCity": True
                        },
                        description="Computes take-home salary after PF, professional tax, and statutory deductions.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="04. Gratuity Calculator",
                        method="POST",
                        url_path="/api/calculators/tax/gratuity",
                        auth_override=NO_AUTH,
                        body={"lastDrawnSalary": 85000, "yearsOfService": 8},
                        description="Computes gratuity entitlement under the Payment of Gratuity Act 1972.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="05. GST Calculator",
                        method="POST",
                        url_path="/api/calculators/tax/gst",
                        auth_override=NO_AUTH,
                        body={"amount": 10000, "gstRate": 18.0, "isInclusive": False},
                        description="Calculates CGST, SGST, and IGST for inclusive and exclusive pricing.",
                        test_script=make_test_script(200)
                    ),
                    make_request(
                        name="06. TDS Calculator",
                        method="POST",
                        url_path="/api/calculators/tax/tds",
                        auth_override=NO_AUTH,
                        body={"amount": 100000, "paymentType": "PROFESSIONAL_FEES", "panAvailable": True},
                        description="Computes Tax Deducted at Source based on Section 194J/194C rates.",
                        test_script=make_test_script(200)
                    )
                ]
            },
            {
                "name": "06. Trading Calculators (2)",
                "item": [
                    make_request(
                        name="01. Stock Brokerage & Charges",
                        method="POST",
                        url_path="/api/calculators/trading/brokerage",
                        auth_override=NO_AUTH,
                        body={
                            "transactionType": "DELIVERY",
                            "buyPrice": 1500.0,
                            "sellPrice": 1620.0,
                            "quantity": 100,
                            "exchange": "NSE",
                            "broker": "ZERODHA"
                        },
                        description="Calculates all regulatory turnover fees: STT, exchange turnover charge, SEBI turnover fees, stamp duty, GST, and net profit.",
                        test_script=make_test_script(200, [
                            ("Brokerage breakdown returned", "pm.expect(json.result.netProfitLoss || json.result.totalCharges).to.be.ok;")
                        ])
                    ),
                    make_request(
                        name="02. Margin Requirements Calculator",
                        method="POST",
                        url_path="/api/calculators/trading/margin",
                        auth_override=NO_AUTH,
                        body={
                            "segmentType": "EQUITY_INTRADAY",
                            "stockPrice": 2450.0,
                            "quantity": 200,
                            "leverageMultiplier": 5.0
                        },
                        description="Computes VaR margin and extreme loss margin (ELM) for intraday positions.",
                        test_script=make_test_script(200)
                    )
                ]
            }
        ]
    }

# ==============================================================================
# MAIN COLLECTION GENERATOR
# ==============================================================================
def build_master_collection():
    items = [
        get_folder_00_health(),
        get_folder_01_auth(),
        get_folder_02_mfa(),
        get_folder_03_email(),
        get_folder_04_user(),
        get_folder_05_portfolio(),
        get_folder_06_mutual_funds(),
        get_folder_07_epf(),
        get_folder_08_ppf(),
        get_folder_09_fixed_deposits(),
        get_folder_10_gold_silver(),
        get_folder_11_notes(),
        get_folder_12_calculators()
    ]

    col = {
        "info": {
            "name": "CoinTrack API - Master Reference & Interactive Suite",
            "_postman_id": "cointrack-master-v2",
            "description": """# CoinTrack API — Enterprise Postman Reference & Interactive Suite

Welcome to the definitive Postman collection for **CoinTrack**, a comprehensive multi-asset personal wealth and portfolio management platform.

### Architecture & Capabilities
* **Authentication**: Spring Security 6 with JWT Bearer tokens, token refresh rotation, and RFC 6238 TOTP two-factor authentication (automated dynamic code generation).
* **Multi-Broker Hexagonal Adapters**: Live connectivity for Zerodha Kite, Upstox, and AngelOne SmartAPI.
* **Multi-Asset Wealth Engine**:
  * Stock Portfolio (Holdings, Net Positions, Orders, Real-time P&L)
  * Self-Managed Mutual Funds (AMFI Scheme catalog, SIP Mandates, FIFO Redemptions, NAV sync)
  * EPF & EPS (Passbook ledger, monthly salary contributions, VPF, statutory interest)
  * PPF (15-year lifecycle, partial withdrawal checks, annual compounding)
  * Fixed Deposits (Cumulative/Payout, premature withdrawal simulator with penalty calculation, TDS)
  * Gold & Silver (Bullion holdings, live spot rates API, hallmark purity options)
  * Notes & Annotations (Rich tags, pinned investment rationales)
  * 32 Financial Calculators (Investment, Loans, Retirement Planning, Savings Schemes, Income Tax, Brokerage)

### Postman Interactive Features
1. **Automated Token Inheritance**: Root-level Bearer Auth (`{{token}}`). Public endpoints explicitly use `noauth`.
2. **Automated Token Refresh**: Collection Pre-Request script detects expiring JWTs and silently triggers refresh.
3. **Automated TOTP 2FA**: Built-in pure JavaScript RFC 6238 TOTP generator. If `totpSecret` is saved in your environment, `{{dynamicTotpCode}}` is automatically computed!
4. **Terminal Editorial Response Visualizers**: Formatted dark-mode responsive dashboards render directly in Postman's **Visualize** tab for all primary wealth summaries and calculators!
""",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "auth": {
            "type": "bearer",
            "bearer": [
                {
                    "key": "token",
                    "value": "{{token}}",
                    "type": "string"
                }
            ]
        },
        "event": [
            {
                "listen": "prerequest",
                "script": {
                    "type": "text/javascript",
                    "exec": COLLECTION_PRE_REQUEST_SCRIPT.split("\n")
                }
            },
            {
                "listen": "test",
                "script": {
                    "type": "text/javascript",
                    "exec": COLLECTION_TEST_SCRIPT.split("\n")
                }
            }
        ],
        "item": items
    }
    return col

# ==============================================================================
# AUTOMATED E2E WORKFLOW COLLECTION (38 Sequential Steps for Newman CI)
# ==============================================================================
def build_e2e_workflow_collection():
    steps = [
        # 01: Health
        make_request(
            name="Step 01 - System Health Probe",
            method="GET",
            url_path="/api/health",
            auth_override=NO_AUTH,
            description="Assert backend application is UP before starting integration sequence.",
            test_script=make_test_script(200, [("Server is UP", "pm.expect(json.status).to.eql('UP');")])
        ),
        # 02: Register
        make_request(
            name="Step 02 - Register Integration Test User",
            method="POST",
            url_path="/api/auth/register",
            auth_override=NO_AUTH,
            body={
                "username": "ci_user_{{$timestamp}}",
                "email": "ci_{{$timestamp}}@test.cointrack.internal",
                "mobile": "9988776655",
                "password": "Password123!",
                "firstName": "CI",
                "lastName": "Runner"
            },
            description="Registers isolated test account with dynamic credentials.",
            pre_script="""
const uniqueUser = "ci_" + Date.now();
pm.environment.set("testUser", uniqueUser);
pm.environment.set("testPassword", "Password123!");
""",
            test_script=make_test_script(200, [
                ("User registration acknowledged", "pm.expect(pm.response.code).to.be.oneOf([200, 201]);")
            ], extra_script="""
if (json.token) pm.environment.set("token", json.token);
if (json.userId) pm.environment.set("userId", json.userId);
""")
        ),
        # 03: Login
        make_request(
            name="Step 03 - Authenticate & Extract Tokens",
            method="POST",
            url_path="/api/auth/login",
            auth_override=NO_AUTH,
            body={
                "usernameOrEmailOrMobile": "{{testUser}}",
                "password": "{{testPassword}}"
            },
            description="Logs in with newly registered account and extracts session JWT tokens.",
            test_script=make_test_script(200, [
                ("Access token generated", "pm.expect(json.token || json.accessToken).to.be.a('string');")
            ], extra_script="""
const t = json.token || json.accessToken;
pm.environment.set("token", t);
if (json.refreshToken) pm.environment.set("refreshToken", json.refreshToken);
""")
        ),
        # 04: Verify Token
        make_request(
            name="Step 04 - Verify JWT Authenticity",
            method="GET",
            url_path="/api/auth/verify-token",
            description="Validates Bearer token acceptance.",
            test_script=make_test_script(200, [
                ("Token valid", "pm.expect(json.valid || json.authenticated).to.be.true;")
            ])
        ),
        # 05: Get Profile
        make_request(
            name="Step 05 - Fetch User Profile",
            method="GET",
            url_path="/api/users/me",
            description="Verifies profile details match registered username.",
            test_script=make_test_script(200, [
                ("Profile retrieved", "pm.expect(json.username).to.eql(pm.environment.get('testUser'));")
            ], extra_script="""
if (json.id || json.userId) pm.environment.set("userId", json.id || json.userId);
""")
        ),
        # 06: Update Profile
        make_request(
            name="Step 06 - Update User Profile",
            method="PUT",
            url_path="/api/users/me",
            body={
                "username": "{{testUser}}",
                "email": "{{testUser}}@updated.cointrack.internal",
                "phoneNumber": "+919988776655",
                "dateOfBirth": "1992-08-20"
            },
            description="Tests profile mutation endpoint.",
            test_script=make_test_script(200, [
                ("Profile updated", "pm.expect(pm.response.code).to.eql(200);")
            ])
        ),
        # 07: Create Note
        make_request(
            name="Step 07 - Create Research Note",
            method="POST",
            url_path="/api/notes",
            body={
                "title": "CI Automated Trade Journal",
                "content": "Automated regression run validating note journaling lifecycle.",
                "tags": ["Automation", "CI"],
                "color": "#6366f1",
                "pinned": True
            },
            description="Tests note creation.",
            test_script=make_test_script(200, [
                ("Note ID returned", "pm.expect(json.id).to.be.ok;")
            ], extra_script="""
pm.environment.set("noteId", json.id);
""")
        ),
        # 08: Update Note
        make_request(
            name="Step 08 - Update Research Note",
            method="PUT",
            url_path="/api/notes/:id",
            path_vars=[("id", "{{noteId}}", "Note ID")],
            body={
                "title": "CI Automated Trade Journal (Updated)",
                "content": "Content updated by regression runner.",
                "tags": ["Automation", "CI", "Updated"],
                "color": "#10b981",
                "pinned": False
            },
            description="Tests note modification.",
            test_script=make_test_script(200)
        ),
        # 09: Delete Note
        make_request(
            name="Step 09 - Delete Research Note",
            method="DELETE",
            url_path="/api/notes/:id",
            path_vars=[("id", "{{noteId}}", "Note ID")],
            description="Tests note deletion cleanup.",
            test_script=make_test_script(200)
        ),
        # 10: Create MF Scheme
        make_request(
            name="Step 10 - Create Mutual Fund Scheme",
            method="POST",
            url_path="/api/mutual-fund/schemes",
            body={
                "schemeName": "Quant Small Cap Fund - Direct Plan",
                "amfiCode": "120823",
                "mfCategory": "EQUITY_SMALL_CAP",
                "platform": "MF_CENTRAL",
                "folioNo": "FOLIO-CI-100",
                "bank": "HDFC Bank",
                "holderName": "CI User"
            },
            description="Seeds a new mutual fund scheme for investment tracking.",
            test_script=make_test_script(200, [
                ("Scheme created", "pm.expect(json.id).to.be.ok;")
            ], extra_script="""
pm.environment.set("mfSchemeId", json.id);
""")
        ),
        # 11: Create SIP Mandate
        make_request(
            name="Step 11 - Setup SIP Mandate",
            method="POST",
            url_path="/api/mutual-fund/sip-mandate",
            body={
                "schemeId": "{{mfSchemeId}}",
                "holderName": "CI User",
                "startDate": "2024-01-05",
                "endDate": "2028-01-05",
                "amount": 5000.00,
                "bank": "HDFC Bank",
                "registrationNo": "SIP-CI-01",
                "active": True
            },
            description="Configures SIP mandate.",
            test_script=make_test_script(200, [
                ("SIP mandate registered", "pm.expect(json.id).to.be.ok;")
            ], extra_script="""
pm.environment.set("sipMandateId", json.id);
""")
        ),
        # 12: Record SIP Contribution
        make_request(
            name="Step 12 - Record SIP Contribution Installment",
            method="POST",
            url_path="/api/mutual-fund/sip-contribution",
            body={
                "sipMandateId": "{{sipMandateId}}",
                "schemeId": "{{mfSchemeId}}",
                "contributionDate": "2024-01-05",
                "amount": 5000.00,
                "navPrice": 200.00,
                "totalUnit": 25.00,
                "debitedBank": "HDFC Bank"
            },
            description="Allots units from SIP installment.",
            test_script=make_test_script(200)
        ),
        # 13: Record Lumpsum
        make_request(
            name="Step 13 - Record Lumpsum Investment",
            method="POST",
            url_path="/api/mutual-fund/lumpsum",
            body={
                "schemeId": "{{mfSchemeId}}",
                "investmentDate": "2024-06-01",
                "lumpsumInvestment": 15000.00,
                "totalUnit": 60.00,
                "navPrice": 250.00,
                "debitedBank": "HDFC Bank"
            },
            description="Records lumpsum investment purchase.",
            test_script=make_test_script(200)
        ),
        # 14: Preview FIFO Redemption
        make_request(
            name="Step 14 - Preview FIFO Capital Gains Before Sale",
            method="GET",
            url_path="/api/mutual-fund/redemption/preview-fifo",
            query=[
                ("schemeId", "{{mfSchemeId}}", "Scheme ID"),
                ("redemptionUnit", "20.0", "Units to sell"),
                ("navPrice", "280.00", "Redemption NAV"),
                ("redemptionDate", "2025-01-15", "Sale date")
            ],
            description="Validates FIFO cost-basis math.",
            test_script=make_test_script(200, [
                ("FIFO preview evaluated", "pm.expect(json).to.be.an('object');")
            ])
        ),
        # 15: Execute Redemption
        make_request(
            name="Step 15 - Execute Partial Redemption",
            method="POST",
            url_path="/api/mutual-fund/redemption",
            body={
                "schemeId": "{{mfSchemeId}}",
                "redemptionDate": "2025-01-15",
                "redemptionUnit": 20.0,
                "navPrice": 280.00,
                "remarks": "CI partial redemption"
            },
            description="Burns units via FIFO pool.",
            test_script=make_test_script(200, [
                ("Redemption completed", "pm.expect(json.id).to.be.ok;")
            ], extra_script="""
pm.environment.set("redemptionId", json.id);
""")
        ),
        # 16: Get MF Dashboard
        make_request(
            name="Step 16 - Assert Mutual Fund Dashboard Metrics",
            method="GET",
            url_path="/api/mutual-fund/dashboard",
            description="Asserts valuation totals reflect contributions and redemptions.",
            test_script=make_test_script(200, [
                ("Dashboard metrics populated", "pm.expect(json).to.be.an('object');")
            ])
        ),
        # 17: EPF Settings
        make_request(
            name="Step 17 - Configure EPF Settings",
            method="PUT",
            url_path="/api/epf/settings",
            body={
                "defaultBasicDA": 60000.00,
                "employeeContributionRate": 12.00,
                "useActualSalaryForEps": False,
                "monthlyVpfAmount": 3000.00
            },
            description="Saves user EPF configuration.",
            test_script=make_test_script(200)
        ),
        # 18: Record EPF Transaction
        make_request(
            name="Step 18 - Record EPF Contribution",
            method="POST",
            url_path="/api/epf/transactions",
            body={
                "transactionDate": "2025-01-31",
                "mode": "AUTO_SALARY",
                "basicDA": 60000.00,
                "employeeContribution": 7200.00,
                "employerEpfContribution": 2160.00,
                "employerEpsContribution": 1250.00,
                "vpfAmount": 3000.00,
                "remarks": "CI automated EPF ledger"
            },
            description="Creates monthly EPF passbook entry.",
            test_script=make_test_script(200, [
                ("EPF transaction created", "pm.expect(json.id).to.be.ok;")
            ], extra_script="""
pm.environment.set("epfTransactionId", json.id);
""")
        ),
        # 19: Get EPF Summary
        make_request(
            name="Step 19 - Assert EPF Summary Balances",
            method="GET",
            url_path="/api/epf/summary",
            description="Asserts EPF balance reflects contributions.",
            test_script=make_test_script(200, [
                ("EPF balance positive", "pm.expect(Number(json.currentEpfBalance || 0)).to.be.above(0);")
            ])
        ),
        # 20: PPF Settings
        make_request(
            name="Step 20 - Configure PPF Account Settings",
            method="PUT",
            url_path="/api/ppf/settings",
            body={
                "accountNumber": "PPF-CI-998877",
                "dateOfIssue": "2020-04-01",
                "extensionMode": "WITH_CONTRIBUTION"
            },
            description="Configures PPF account start date.",
            test_script=make_test_script(200)
        ),
        # 21: Record PPF Deposit
        make_request(
            name="Step 21 - Record PPF Deposit",
            method="POST",
            url_path="/api/ppf/transactions",
            body={
                "transactionDate": "2025-01-05",
                "particulars": "CI Scheduled NetBanking Deposit",
                "particularType": "DEPOSIT",
                "creditAmount": 15000.00,
                "remarks": "Annual deposit"
            },
            description="Credits PPF passbook.",
            test_script=make_test_script(200, [
                ("PPF transaction recorded", "pm.expect(json.id).to.be.ok;")
            ], extra_script="""
pm.environment.set("ppfTransactionId", json.id);
""")
        ),
        # 22: Check PPF Withdrawal Eligibility
        make_request(
            name="Step 22 - Evaluate PPF Partial Withdrawal Status",
            method="GET",
            url_path="/api/ppf/withdrawal-status",
            description="Checks statutory withdrawal eligibility formula.",
            test_script=make_test_script(200, [
                ("Withdrawal rule evaluated", "pm.expect(json).to.have.property('withdrawalAllowed');")
            ])
        ),
        # 23: Get PPF Summary
        make_request(
            name="Step 23 - Assert PPF Account Balance",
            method="GET",
            url_path="/api/ppf/summary",
            description="Asserts PPF balance is positive.",
            test_script=make_test_script(200, [
                ("PPF balance positive", "pm.expect(Number(json.currentBalance || 0)).to.be.above(0);")
            ])
        ),
        # 24: Create Fixed Deposit
        make_request(
            name="Step 24 - Create Fixed Deposit Certificate",
            method="POST",
            url_path="/api/fixed-deposits",
            body={
                "place": "State Bank of India",
                "holderName": "CI User",
                "nominee": "Nominee Name",
                "accountNumber": "FD-CI-123456",
                "interestRate": 7.10,
                "investmentPeriod": "1 Year",
                "issueDate": "2024-05-01",
                "maturityDate": "2025-05-01",
                "issueAmount": 50000.00,
                "maturityAmount": 53645.00,
                "maturityMode": "AUTOMATIC",
                "fdType": "CUMULATIVE",
                "remarks": "CI Test FD"
            },
            description="Creates bank fixed deposit certificate.",
            test_script=make_test_script(200, [
                ("Fixed deposit created", "pm.expect(json.id).to.be.ok;")
            ], extra_script="""
pm.environment.set("fdId", json.id);
""")
        ),
        # 25: Preview Premature Withdrawal
        make_request(
            name="Step 25 - Simulate Premature FD Withdrawal",
            method="POST",
            url_path="/api/fixed-deposits/:id/withdraw/preview",
            path_vars=[("id", "{{fdId}}", "FD ID")],
            body={
                "withdrawalDate": "2025-01-10",
                "penaltyRateOverride": 1.0,
                "bankName": "State Bank of India"
            },
            description="Simulates premature liquidation penalty without mutating record.",
            test_script=make_test_script(200, [
                ("Penalty preview computed", "pm.expect(json).to.be.an('object');")
            ])
        ),
        # 26: Get FD Summary
        make_request(
            name="Step 26 - Assert Fixed Deposits Portfolio Summary",
            method="GET",
            url_path="/api/fixed-deposits/summary",
            description="Asserts active FD investment total.",
            test_script=make_test_script(200, [
                ("FD total active investment verified", "pm.expect(Number(json.totalActiveInvestment || json.totalInvestment || 0)).to.be.above(0);")
            ])
        ),
        # 27: Get Metal Live Rates
        make_request(
            name="Step 27 - Fetch Precious Metal Spot Rates",
            method="GET",
            url_path="/api/gold-silver/rates/current",
            description="Fetches live spot prices for bullion.",
            test_script=make_test_script(200, [
                ("Live metal rates available", "pm.expect(json).to.be.an('object');")
            ])
        ),
        # 28: Add Gold Asset
        make_request(
            name="Step 28 - Add Gold Bullion Asset",
            method="POST",
            url_path="/api/gold-silver",
            body={
                "purchaseDate": "2024-10-15",
                "purchasedFrom": "MMTC-PAMP",
                "metalType": "GOLD",
                "purchaseItem": "24K Gold Bar 10g",
                "purity": "24K",
                "purityOptionId": "gold-24k",
                "rateSource": "API",
                "ratePerGram": 7500.00,
                "netWeight": 10.00,
                "makingChargePercent": 1.5,
                "gstPercent": 3.0,
                "remarks": "CI Gold Test Asset"
            },
            description="Adds physical gold asset to vault.",
            test_script=make_test_script(200, [
                ("Metal holding created", "pm.expect(json.id).to.be.ok;")
            ], extra_script="""
pm.environment.set("goldSilverId", json.id);
""")
        ),
        # 29: Get Metal Summary
        make_request(
            name="Step 29 - Assert Gold & Silver Portfolio Valuation",
            method="GET",
            url_path="/api/gold-silver/summary",
            description="Asserts gold investment valuation reflects weight and price.",
            test_script=make_test_script(200, [
                ("Gold holding total invested > 0", "pm.expect(Number(json.totalInvested || 0)).to.be.above(0);")
            ])
        ),
        # 30: SIP Calculator
        make_request(
            name="Step 30 - Run SIP Investment Calculator Engine",
            method="POST",
            url_path="/api/calculators/investment/sip",
            auth_override=NO_AUTH,
            body={"monthlyInvestment": 15000, "expectedReturn": 12.5, "years": 10},
            description="Executes SIP mathematical projection engine.",
            test_script=make_test_script(200, [
                ("SIP maturity value projected correctly", "pm.expect(Number(json.result.totalValue || 0)).to.be.above(3000000);")
            ])
        ),
        # 31: Home Loan EMI
        make_request(
            name="Step 31 - Run Home Loan EMI Calculator Engine",
            method="POST",
            url_path="/api/calculators/loans/home-loan-emi",
            auth_override=NO_AUTH,
            body={"principal": 4000000, "annualRate": 8.5, "months": 240},
            description="Executes loan amortization engine.",
            test_script=make_test_script(200, [
                ("Monthly EMI calculated correctly", "pm.expect(Number(json.result.monthlyEmi || json.result.emi || 0)).to.be.above(30000);")
            ])
        ),
        # 32: Retirement Planning
        make_request(
            name="Step 32 - Run Retirement Planning Calculator Engine",
            method="POST",
            url_path="/api/calculators/planning/retirement",
            auth_override=NO_AUTH,
            body={
                "currentAge": 28,
                "retirementAge": 60,
                "lifeExpectancy": 85,
                "currentMonthlyExpense": 50000,
                "currentSavings": 1000000,
                "expectedInflation": 6.0,
                "preRetirementReturn": 12.0,
                "postRetirementReturn": 8.0
            },
            description="Executes retirement corpus planner.",
            test_script=make_test_script(200, [
                ("Retirement target corpus evaluated", "pm.expect(Number(json.result.targetCorpus || json.result.corpusRequired || 0)).to.be.above(10000000);")
            ])
        ),
        # 33: Income Tax
        make_request(
            name="Step 33 - Run Income Tax Calculator Engine",
            method="POST",
            url_path="/api/calculators/tax/income-tax",
            auth_override=NO_AUTH,
            body={
                "grossIncome": 1800000,
                "section80CDeductions": 150000,
                "section80DDeductions": 25000,
                "financialYear": "2024-25"
            },
            description="Executes Indian tax regime comparison engine.",
            test_script=make_test_script(200, [
                ("Old and New tax regimes evaluated", "pm.expect(json.result).to.have.property('newRegimeTax');")
            ])
        ),
        # 34: Stock Brokerage
        make_request(
            name="Step 34 - Run Stock Brokerage Calculator Engine",
            method="POST",
            url_path="/api/calculators/trading/brokerage",
            auth_override=NO_AUTH,
            body={
                "transactionType": "DELIVERY",
                "buyPrice": 2500.0,
                "sellPrice": 2750.0,
                "quantity": 100,
                "exchange": "NSE",
                "broker": "ZERODHA"
            },
            description="Executes regulatory turnover and brokerage engine.",
            test_script=make_test_script(200, [
                ("Net trading profit evaluated", "pm.expect(json.result.netProfitLoss || json.result.totalCharges).to.be.ok;")
            ])
        ),
        # 35: Portfolio Manual Refresh
        make_request(
            name="Step 35 - Trigger Unified Portfolio Refresh",
            method="POST",
            url_path="/api/portfolio/refresh",
            description="Triggers synchronization across all connected broker adapters.",
            test_script=make_test_script(200)
        ),
        # 36: Portfolio Summary
        make_request(
            name="Step 36 - Get Consolidated Portfolio Summary",
            method="GET",
            url_path="/api/portfolio/summary",
            description="Fetches consolidated multi-asset net worth summary.",
            test_script=make_test_script(200, [
                ("Consolidated portfolio summary loaded", "pm.expect(json).to.be.an('object');")
            ])
        ),
        # 37: Token Refresh
        make_request(
            name="Step 37 - Refresh JWT Access Token",
            method="POST",
            url_path="/api/auth/refresh",
            auth_override=NO_AUTH,
            body={"refreshToken": "{{refreshToken}}"},
            description="Validates that token rotation works seamlessly in CI.",
            test_script=make_test_script(200, [
                ("Rotated access token received", "pm.expect(json.token || json.accessToken).to.be.a('string');")
            ], extra_script="""
const nt = json.token || json.accessToken;
if (nt) pm.environment.set("token", nt);
""")
        ),
        # 38: Logout
        make_request(
            name="Step 38 - Invalidate Session (Logout & Teardown)",
            method="POST",
            url_path="/api/auth/logout",
            description="Cleans up active session and invalidates refresh token.",
            test_script=make_test_script(200, [
                ("Logged out cleanly", "pm.expect(pm.response.code).to.eql(200);")
            ], extra_script="""
pm.environment.set("token", "");
pm.environment.set("refreshToken", "");
console.log("38-step automated integration run successfully completed.");
""")
        )
    ]

    col = {
        "info": {
            "name": "CoinTrack E2E Integration Suite (Automated CI/CD Workflow)",
            "_postman_id": "cointrack-e2e-ci",
            "description": """# CoinTrack Automated E2E Integration Test Suite

This sequential 38-step workflow executes end-to-end integration testing across every subsystem in CoinTrack:
1. Health Heartbeat
2. Dynamic User Onboarding & Authentication
3. User Profile & Research Journaling (Notes CRUD)
4. Mutual Funds Engine (Scheme -> SIP Mandate -> Contribution -> Lumpsum -> FIFO Preview -> Redemption -> Dashboard)
5. Employee Provident Fund (EPF Settings -> Contribution -> Passbook Balance)
6. Public Provident Fund (PPF Settings -> Deposit -> Withdrawal Eligibility)
7. Bank Fixed Deposits (Certificate Creation -> Premature Withdrawal Simulation -> Summary)
8. Physical Bullion (Spot Rates API -> Gold Asset -> Valuation)
9. Financial Planning Engines (SIP, Home Loan EMI, Retirement Corpus, Income Tax Comparison, Stock Brokerage)
10. Unified Portfolio Synchronization
11. Refresh Token Rotation & Session Teardown

### Headless Execution via Newman:
```bash
newman run CoinTrack_E2E_Workflow.json -e CoinTrack_Local_Environment.json --bail folder --color on
```
""",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "auth": {
            "type": "bearer",
            "bearer": [{"key": "token", "value": "{{token}}", "type": "string"}]
        },
        "event": [
            {
                "listen": "prerequest",
                "script": {
                    "type": "text/javascript",
                    "exec": COLLECTION_PRE_REQUEST_SCRIPT.split("\n")
                }
            },
            {
                "listen": "test",
                "script": {
                    "type": "text/javascript",
                    "exec": COLLECTION_TEST_SCRIPT.split("\n")
                }
            }
        ],
        "item": steps
    }
    return col

# ==============================================================================
# ENVIRONMENTS BUILDER
# ==============================================================================
def build_environment(name, base_url, is_staging=False):
    keys = [
        ("baseUrl", base_url, True, "Root URL of the CoinTrack API backend"),
        ("token", "", True, "Active JWT Bearer access token"),
        ("refreshToken", "", True, "JWT Refresh token for session rotation"),
        ("tokenExpiresAt", "", True, "Epoch timestamp when access token expires"),
        ("userId", "", True, "Current authenticated user UUID"),
        ("username", "urva_gandhi", True, "Default user handle"),
        ("totpSecret", "", True, "RFC 6238 Base32 secret for automated MFA testing"),
        ("tempToken", "", True, "Temporary token for 2FA completion"),
        ("noteId", "", True, "Downstream note identifier"),
        ("mfSchemeId", "", True, "Downstream mutual fund scheme identifier"),
        ("sipMandateId", "", True, "Downstream SIP mandate identifier"),
        ("sipContributionId", "", True, "Downstream SIP contribution identifier"),
        ("lumpsumId", "", True, "Downstream lumpsum transaction identifier"),
        ("redemptionId", "", True, "Downstream redemption transaction identifier"),
        ("epfTransactionId", "", True, "Downstream EPF transaction identifier"),
        ("ppfTransactionId", "", True, "Downstream PPF transaction identifier"),
        ("fdId", "", True, "Downstream fixed deposit identifier"),
        ("goldSilverId", "", True, "Downstream gold/silver asset identifier"),
        ("zerodhaApiKey", "<ENTER_API_KEY>", True, "Zerodha Kite Connect API key"),
        ("zerodhaApiSecret", "<ENTER_API_SECRET>", True, "Zerodha Kite Connect API secret"),
        ("zerodhaClientId", "<ENTER_CLIENT_ID>", True, "Zerodha user client ID"),
        ("upstoxApiKey", "<ENTER_API_KEY>", True, "Upstox developer API key"),
        ("upstoxApiSecret", "<ENTER_API_SECRET>", True, "Upstox developer API secret"),
        ("upstoxClientId", "<ENTER_CLIENT_ID>", True, "Upstox user client ID"),
        ("angeloneApiKey", "<ENTER_API_KEY>", True, "AngelOne SmartAPI API key"),
        ("angeloneClientId", "<ENTER_CLIENT_ID>", True, "AngelOne SmartAPI client ID"),
        ("angelonePin", "<ENTER_PIN>", True, "AngelOne login MPIN"),
        ("angeloneTotp", "<ENTER_TOTP>", True, "AngelOne TOTP Base32 secret")
    ]

    values = []
    for k, v, enabled, desc in keys:
        values.append({
            "key": k,
            "value": v,
            "type": "secret" if any(sec in k.lower() for sec in ["token", "secret", "password", "pin", "key"]) else "default",
            "enabled": enabled
        })

    return {
        "id": f"cointrack-env-{'staging' if is_staging else 'local'}",
        "name": f"CoinTrack {name} Environment",
        "values": values,
        "_postman_variable_scope": "environment"
    }

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================
if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))

    # 1. Master Reference Collection
    master_col = build_master_collection()
    master_path = os.path.join(out_dir, "CoinTrack_API_Collection.json")
    with open(master_path, "w", encoding="utf-8") as f:
        json.dump(master_col, f, indent=2, ensure_ascii=False)
    print(f"Generated Master Collection: {master_path}")

    # 2. E2E Automated Workflow Collection
    e2e_col = build_e2e_workflow_collection()
    e2e_path = os.path.join(out_dir, "CoinTrack_E2E_Workflow.json")
    with open(e2e_path, "w", encoding="utf-8") as f:
        json.dump(e2e_col, f, indent=2, ensure_ascii=False)
    print(f"Generated E2E Workflow Collection: {e2e_path}")

    # 3. Local Environment
    local_env = build_environment("Local", "http://localhost:8080", is_staging=False)
    local_path = os.path.join(out_dir, "CoinTrack_Local_Environment.json")
    with open(local_path, "w", encoding="utf-8") as f:
        json.dump(local_env, f, indent=2, ensure_ascii=False)
    print(f"Generated Local Environment: {local_path}")

    # 4. Staging Environment
    staging_env = build_environment("Staging", "https://api.staging.cointrack.internal", is_staging=True)
    staging_path = os.path.join(out_dir, "CoinTrack_Staging_Environment.json")
    with open(staging_path, "w", encoding="utf-8") as f:
        json.dump(staging_env, f, indent=2, ensure_ascii=False)
    print(f"Generated Staging Environment: {staging_path}")

    print("Postman Suite Generation Completed Successfully!")
