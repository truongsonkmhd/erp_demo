package com.xxxx.ddd.controller.realtime;

import com.xxxx.ddd.application.service.auth.JwtService;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

/**
 * Browsers cannot send an Authorization header on the WebSocket handshake, so the JWT is checked on the
 * STOMP CONNECT frame instead (same checks as JwtAuthenticationFilter). Clients may only listen to
 * /topic/vldc/**; they never send.
 */
@Component
public class StompAuthInterceptor implements ChannelInterceptor {
    static final String TOPIC_PREFIX = "/topic/vldc/";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public StompAuthInterceptor(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) return message;
        switch (accessor.getCommand()) {
            case CONNECT -> accessor.setUser(authenticate(accessor.getFirstNativeHeader("Authorization")));
            case SUBSCRIBE -> {
                if (accessor.getUser() == null) throw new MessagingException("Unauthorized");
                String destination = accessor.getDestination();
                if (destination == null || !destination.startsWith(TOPIC_PREFIX)) throw new MessagingException("Forbidden destination");
            }
            case SEND -> throw new MessagingException("Sending is not allowed");
            default -> { }
        }
        return message;
    }

    private UsernamePasswordAuthenticationToken authenticate(String header) {
        if (header == null || !header.startsWith("Bearer ")) throw new MessagingException("Unauthorized");
        String token = header.substring(7);
        try {
            if (!jwtService.isValid(token)) throw new MessagingException("Unauthorized");
            UserDetails user = userDetailsService.loadUserByUsername(jwtService.extractUsername(token));
            if (!user.isEnabled() || !user.isAccountNonLocked()) throw new MessagingException("Unauthorized");
            return new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        } catch (MessagingException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new MessagingException("Unauthorized");
        }
    }
}
