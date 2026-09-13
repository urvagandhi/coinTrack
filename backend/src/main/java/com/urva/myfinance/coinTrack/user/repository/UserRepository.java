package com.urva.myfinance.coinTrack.user.repository;

import com.urva.myfinance.coinTrack.user.model.User;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface UserRepository extends MongoRepository<User, String> {

  /**
   * Single round-trip lookup across username / email / normalized phone. The phone branch falls
   * back to a no-match sentinel when no phone is present so {@code $or} never matches documents
   * whose field is null/missing.
   */
  @Query("{ '$or': [ { 'username': ?0 }, { 'email': ?1 }, { 'phoneNumber': ?2 } ] }")
  User findByIdentifier(String username, String email, String phoneNumber);

  User findByUsername(String username);

  User findByEmail(String email);

  User findByPhoneNumber(String phoneNumber);

  boolean existsByUsername(String username);

  boolean existsByEmail(String email);

  boolean existsByPhoneNumber(String phoneNumber);

  // Optional-returning methods for safe lookups
  Optional<User> findOptionalByUsername(String username);

  Optional<User> findOptionalByEmail(String email);

  Optional<User> findOptionalByPhoneNumber(String phoneNumber);

  Optional<User> findByGoogleId(String googleId);
}
