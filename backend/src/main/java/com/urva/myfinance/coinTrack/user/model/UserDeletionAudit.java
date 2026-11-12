package com.urva.myfinance.coinTrack.user.model;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Immutable compliance record written BEFORE an account is destroyed.
 *
 * <p>Industry-standard deletion trail: who was deleted, when, from where, and under what
 * reason/status. The live User document is gone after deletion — this snapshot is the only
 * remaining identity evidence, retained for dispute resolution, fraud investigation, and regulatory
 * audits. It intentionally contains NO credentials and is never served through any public API.
 */
@Document("user_deletion_audits")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDeletionAudit {

  @Id private String id;

  /** Deleted account's id (retained even though the User doc is gone). */
  @Indexed private String userId;

  private String username;

  private String email;

  private String name;

  private String phoneNumber;

  /** Auth provider(s) at time of deletion, e.g. LOCAL / GOOGLE. */
  private String authProvider;

  private boolean emailVerified;

  private boolean totpEnabled;

  /** When the account was originally created (as reported by the User doc). */
  private String accountCreatedAt;

  /** When the deletion request was accepted. */
  private Instant deletionRequestedAt;

  /** Actor performing the deletion — self-service, so same as userId. */
  private String deletedByUserId;

  private String ipAddress;

  private String userAgent;

  /** Why the account was deleted, e.g. USER_REQUESTED. */
  private String reason;

  /** IN_PROGRESS while cascade runs; COMPLETED once the event has fired. */
  private String status;

  /** Set when the full cascade finished successfully. */
  private Instant completedAt;
}
