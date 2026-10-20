package com.xxxx.ddd.infrastructure.security;

import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.respository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameOrEmailWithAuth(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return new AuthUserDetails(user);
    }
}
