package com.urva.myfinance.coinTrack.email.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.EnvironmentAware;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.lang.NonNull;

/**
 * Defense-in-depth guard: fails loud at startup if the magic-link signing secret equals the auth
 * JWT secret. The two secret domains must stay disjoint so a PASSWORD_RESET_TEMP token can never be
 * mistaken for an auth token even if a route were misconfigured (JwtFilter would reject it by
 * signature).
 */
@Configuration
public class MagicLinkSecretGuard
    implements ApplicationListener<ApplicationReadyEvent>, EnvironmentAware {

  private static final Logger log = LoggerFactory.getLogger(MagicLinkSecretGuard.class);

  private Environment environment;

  @Override
  public void setEnvironment(@NonNull Environment environment) {
    this.environment = environment;
  }

  @Override
  public void onApplicationEvent(@NonNull ApplicationReadyEvent event) {
    String magicLinkSecret = environment.getProperty("email.magic-link-secret");
    String jwtSecret = environment.getProperty("jwt.secret");

    if (magicLinkSecret != null && magicLinkSecret.equals(jwtSecret)) {
      log.error(
          "SECURITY CONFIGURATION ERROR: EMAIL_MAGIC_LINK_SECRET is identical to JWT_SECRET. "
              + "Magic-link tokens and auth tokens MUST use different secrets to preserve "
              + "the two-tier token model. Regenerate one of them before production traffic.");
    }
  }
}
