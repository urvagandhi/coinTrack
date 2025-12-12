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
    private final NotificationService notificationService;

    // Simple in-memory storage for OTPs: username -> OtpData
    private final java.util.Map<String, OtpData> otpStorage = new java.util.concurrent.ConcurrentHashMap<>();

    private static class OtpData {
        String otp;
        long expiryTime;

        OtpData(String otp, long expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }
    }

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            AuthenticationManager authManager, JWTService jwtService, NotificationService notificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authManager = authManager;
        this.jwtService = jwtService;
        this.notificationService = notificationService;
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

            // Check if username already exists
            User existingUser = userRepository.findByUsername(user.getUsername());
            if (existingUser != null) {
                throw new RuntimeException(
                        "Username already exists: " + user.getUsername() + ". Please choose a different username.");
            }

            user.setPassword(passwordEncoder.encode(user.getPassword()));
            return userRepository.save(user);
        } catch (RuntimeException e) {
            throw new RuntimeException("Error registering user: " + e.getMessage(), e);
        }
    }

    public boolean isUsernameAvailable(String username) {
        try {
            return !userRepository.existsByUsername(username);
        } catch (Exception e) {
            throw new RuntimeException("Error checking username availability: " + e.getMessage(), e);
        }
    }

    /**
     * Authenticate user with username, email, or mobile number.
     *
     * @param usernameOrEmailOrMobile username, email, or mobile number
     * @param password                user password
     * @return LoginResponse with JWT token and user info
     */
    /**
     * Authenticate user and trigger OTP if credentials are valid.
     *
     * @param usernameOrEmailOrMobile username, email, or mobile number
     * @param password                user password
     * @return LoginResponse with requiresOtp=true
     */
    public LoginResponse authenticate(String usernameOrEmailOrMobile, String password) {
        try {
            // Find user by username, email, or mobile
            User foundUser = findUserByUsernameEmailOrMobile(usernameOrEmailOrMobile);

            if (foundUser == null) {
                return null; // Invalid credentials
            }

            // Verify password manually or via AuthManager
            // Using AuthManager ensures consistent behavior
            Authentication authentication = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(foundUser.getUsername(), password));

            if (authentication.isAuthenticated()) {
                // Generate 6-digit OTP
                String otp = String.format("%06d", new java.util.Random().nextInt(999999));

                // Store OTP (valid for 5 minutes)
                long expiryTime = System.currentTimeMillis() + (5 * 60 * 1000);
                otpStorage.put(foundUser.getUsername(), new OtpData(otp, expiryTime));

                // Send OTP
                String contact = foundUser.getEmail() != null ? foundUser.getEmail() : foundUser.getPhoneNumber();
                notificationService.sendOtp(contact, otp);

                // Return Partial LoginResponse
                LoginResponse loginResponse = new LoginResponse();
                loginResponse.setRequiresOtp(true);
                loginResponse.setUserId(foundUser.getId());
                loginResponse.setUsername(foundUser.getUsername());
                loginResponse.setEmail(foundUser.getEmail());
                loginResponse.setMobile(foundUser.getPhoneNumber()); // Assuming getPhoneNumber exists
                loginResponse.setMessage("OTP sent to your registered contact.");
                return loginResponse;
            } else {
                return null; // Authentication failed
            }
        } catch (AuthenticationException e) {
            return null; // Invalid credentials
        } catch (Exception e) {
            throw new RuntimeException("Authentication error: " + e.getMessage(), e);
        }
    }

    /**
     * Verify OTP and issue Token.
     */
    public LoginResponse verifyOtp(String usernameOrEmailOrMobile, String otp) {
        try {
            // Resolve user first to ensure we have the correct username key for OTP storage
            User user = findUserByUsernameEmailOrMobile(usernameOrEmailOrMobile);

            if (user == null) {
                throw new RuntimeException("User not found");
            }

            String username = user.getUsername();
            OtpData otpData = otpStorage.get(username);

            if (otpData == null) {
                // Debug log (internal only)
                // System.out.println("OTP not found for username: " + username);
                throw new RuntimeException("OTP not found or expired");
            }

            if (System.currentTimeMillis() > otpData.expiryTime) {
                otpStorage.remove(username);
                throw new RuntimeException("OTP expired");
            }

            if (!otpData.otp.equals(otp)) {
                throw new RuntimeException("Invalid OTP");
            }

            // OTP Valid - Remove it
            otpStorage.remove(username);

            // Generate Token
            // We can create a dummy authentication object since we already verified
            // password and OTP
            Authentication authentication = new UsernamePasswordAuthenticationToken(user.getUsername(), null,
                    java.util.Collections.emptyList());
            String token = jwtService.generateToken(authentication);

            LoginResponse loginResponse = new LoginResponse();
            loginResponse.setToken(token);
            loginResponse.setUserId(user.getId());
            loginResponse.setUsername(user.getUsername());
            loginResponse.setEmail(user.getEmail());
            loginResponse.setMobile(user.getPhoneNumber());
            loginResponse.setFirstName(user.getName());
            loginResponse.setRequiresOtp(false);

            return loginResponse;

        } catch (Exception e) {
            throw new RuntimeException("OTP Verification failed: " + e.getMessage());
        }
    }

    /**
     * Find user by username, email, or mobile number.
     *
     * @param identifier username, email, or mobile number
     * @return User object if found, null otherwise
     */
    private User findUserByUsernameEmailOrMobile(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            return null;
        }

        // Try username first
        User user = userRepository.findByUsername(identifier);
        if (user != null) {
            return user;
        }

        // Try email
        user = userRepository.findByEmail(identifier);
        if (user != null) {
            return user;
        }

        // Try mobile (phone number)
        try {
            user = userRepository.findByPhoneNumber(identifier);
            if (user != null) {
                return user;
            }
        } catch (Exception e) {
            // Phone number search failed, continue
        }

        return null;
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
                // Create LoginResponse with individual fields
                LoginResponse loginResponse = new LoginResponse();
                loginResponse.setToken(token);
                loginResponse.setUserId(foundUser.getId());
                loginResponse.setUsername(foundUser.getUsername());
                loginResponse.setEmail(foundUser.getEmail());
                loginResponse.setMobile(foundUser.getPhoneNumber());
                loginResponse.setFirstName(foundUser.getName()); // Assuming name contains first name
                return loginResponse;
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
                org.springframework.security.core.userdetails.UserDetails userDetails = org.springframework.security.core.userdetails.User
                        .builder()
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

    /**
     * Find user by username.
     *
     * @param username the username to search for
     * @return User object if found, null otherwise
     */
    public User findUserByUsername(String username) {
        try {
            if (username == null || username.trim().isEmpty()) {
                return null;
            }
            return userRepository.findByUsername(username);
        } catch (Exception e) {
            throw new RuntimeException("Error finding user by username: " + username + ". " + e.getMessage(), e);
        }
    }
}
