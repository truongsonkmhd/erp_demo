package com.xxxx.ddd.application.service.security;

import com.xxxx.ddd.domain.model.entity.User;
import com.xxxx.ddd.domain.respository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/** The signed-in user, always reloaded from the database (never from client-sent ids, roles or units). */
@Component
public class CurrentActor {
    private final UserRepository users;

    public CurrentActor(UserRepository users) {
        this.users = users;
    }

    public Optional<String> username() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) return Optional.empty();
        return Optional.ofNullable(auth.getName());
    }

    public Optional<User> find() {
        return username().flatMap(users::findByUsernameOrEmailWithAuth);
    }

    public User require() {
        return find().orElseThrow(() -> new AccessDeniedException("Not signed in"));
    }
}
