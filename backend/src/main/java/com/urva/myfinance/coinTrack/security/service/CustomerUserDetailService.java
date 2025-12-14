package com.urva.myfinance.coinTrack.security.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.security.model.UserPrincipal;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

@Service
public class CustomerUserDetailService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomerUserDetailService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        try {
            User user = userRepository.findByUsername(username);
            if (user == null) {
                throw new UsernameNotFoundException("User not found: " + username);
            }
            return new UserPrincipal(user);
        } catch (UsernameNotFoundException e) {
            throw e; // Re-throw expected exception
        } catch (Exception e) {
            throw new UsernameNotFoundException("Error loading user details for username: " + username + ". " + e.getMessage());
        }
    }
}
