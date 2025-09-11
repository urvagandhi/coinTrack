package com.urva.myfinance.coinTrack.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.DTO.LoginResponse;
import com.urva.myfinance.coinTrack.Model.User;
import com.urva.myfinance.coinTrack.Repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authManager;
    private final JWTService jwtService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            AuthenticationManager authManager, JWTService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authManager = authManager;
        this.jwtService = jwtService;
    }

    public List<User> getAllUsers() {
        try {
            return userRepository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Error fetching all users: " + e.getMessage(), e);
        }
    }

    public User getUserById(String id) {
        try {
            Optional<User> user = userRepository.findById(id);
            return user.orElse(null);
        } catch (Exception e) {
            throw new RuntimeException("Error fetching user by id: " + id + ". " + e.getMessage(), e);
        }
    }

    public User updateUser(String id, User user) {
        try {
            Optional<User> existingUserOpt = userRepository.findById(id);
            if (existingUserOpt.isPresent()) {
                User existingUser = existingUserOpt.get();

                // Update only the fields that should be updated, preserve system fields
                if (user.getUsername() != null) {
                    existingUser.setUsername(user.getUsername());
                }
                if (user.getName() != null) {
                    existingUser.setName(user.getName());
                }
                if (user.getDateOfBirth() != null) {
                    existingUser.setDateOfBirth(user.getDateOfBirth());
                }
                if (user.getEmail() != null) {
                    existingUser.setEmail(user.getEmail());
                }
                if (user.getPhoneNumber() != null) {
                    existingUser.setPhoneNumber(user.getPhoneNumber());
                }
                if (user.getPassword() != null) {
                    existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
                }

                return userRepository.save(existingUser);
            }
            return null; // User not found
        } catch (Exception e) {
            throw new RuntimeException("Error updating user with id: " + id + ". " + e.getMessage(), e);
        }
    }

    public boolean deleteUser(String id) {
        try {
            if (userRepository.existsById(id)) {
                userRepository.deleteById(id);
                return true;
            } else {
                return false; // User not found
            }
        } catch (Exception e) {
            throw new RuntimeException("Error deleting user with id: " + id + ". " + e.getMessage(), e);
        }
    }

    public User registerUser(User user) {
        try {
            if (user.getUsername() == null || user.getPassword() == null) {
                return null; // Invalid user
            }
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            return userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Error registering user: " + e.getMessage(), e);
        }
    }

    public LoginResponse verifyUser(User user) {
        try {
            // Find user by username or email
            User foundUser = userRepository.findByUsername(user.getUsername());
            if (foundUser == null) {
                foundUser = userRepository.findByEmail(user.getUsername()); // username field might contain email
            }
            
            if (foundUser == null) {
                throw new RuntimeException("Invalid username or password");
            }

            // Use the actual username for authentication
            Authentication authentication = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(foundUser.getUsername(), user.getPassword()));
            if (authentication.isAuthenticated()) {
                String token = jwtService.generateToken(authentication);
                return new LoginResponse(token, foundUser);
            } else {
                throw new RuntimeException("Invalid username or password");
            }
        } catch (AuthenticationException e) {
            throw new RuntimeException("Invalid username or password");
        }
    }

    public User getUserByToken(String token) {
        try {
            String username = jwtService.extractUsername(token);
            return userRepository.findByUsername(username);
        } catch (Exception e) {
            throw new RuntimeException("Error extracting user from token: " + e.getMessage(), e);
        }
    }

    public boolean isTokenValid(String token) {
        try {
            String username = jwtService.extractUsername(token);
            User user = userRepository.findByUsername(username);
            if (user != null) {
                // Create UserDetails-like object for validation
                org.springframework.security.core.userdetails.UserDetails userDetails = 
                    org.springframework.security.core.userdetails.User.builder()
                        .username(user.getUsername())
                        .password(user.getPassword())
                        .authorities("USER")
                        .build();
                return jwtService.validateToken(token, userDetails);
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}
