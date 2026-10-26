package com.xxxx.ddd.application.vldc;

import com.xxxx.ddd.application.exception.NotFoundException;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Every CollectionService bean, by collection name. */
@Component
public class CollectionRegistry {
    private final Map<String, CollectionService<?>> services = new HashMap<>();

    public CollectionRegistry(List<CollectionService<?>> services) {
        for (CollectionService<?> service : services) {
            if (this.services.putIfAbsent(service.name(), service) != null) {
                throw new IllegalStateException("Duplicate collection: " + service.name());
            }
        }
    }

    public CollectionService<?> get(String name) {
        CollectionService<?> service = services.get(name);
        if (service == null) throw new NotFoundException("Unknown collection: " + name);
        return service;
    }

    public Set<String> names() {
        return Set.copyOf(services.keySet());
    }
}
