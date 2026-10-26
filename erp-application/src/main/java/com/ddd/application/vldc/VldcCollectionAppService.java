package com.xxxx.ddd.application.vldc;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import com.fasterxml.jackson.databind.exc.UnrecognizedPropertyException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Generic entry point of /api/vldc/{collection}: turns raw JSON into the collection's row type,
 * rejecting unknown fields (so a renamed TS field never silently loses data), bad ids and invalid rows.
 */
@Service
public class VldcCollectionAppService {
    static final int MAX_REPLACE_ROWS = 5000;
    private static final Pattern ID = Pattern.compile("^[A-Za-z0-9_.:-]{1,64}$");

    private final CollectionRegistry registry;
    private final ObjectMapper objectMapper;
    private final Validator validator;

    public VldcCollectionAppService(CollectionRegistry registry, ObjectMapper objectMapper, Validator validator) {
        this.registry = registry;
        this.objectMapper = objectMapper;
        this.validator = validator;
    }

    public List<?> findAll(String collection) {
        return registry.get(collection).findAll();
    }

    public boolean isEmpty(String collection) {
        return registry.get(collection).isEmpty();
    }

    public Object upsert(String collection, String id, JsonNode body, String actor) {
        return upsert(registry.get(collection), collection, id, body, actor);
    }

    public int replaceAll(String collection, JsonNode body, String actor, boolean admin) {
        return replaceAll(registry.get(collection), collection, body, actor, admin);
    }

    private <D extends CollectionRow> D upsert(CollectionService<D> service, String collection, String id, JsonNode body, String actor) {
        checkId(id);
        if (body == null || !body.isObject()) throw new IllegalArgumentException("Body must be an object");
        D row = read(service, collection, body);
        if (!Objects.equals(id, row.getId())) throw new IllegalArgumentException("Id mismatch: " + id + " != " + row.getId());
        return service.upsert(row, actor);
    }

    private <D extends CollectionRow> int replaceAll(CollectionService<D> service, String collection, JsonNode body, String actor, boolean admin) {
        if (body == null || !body.isArray()) throw new IllegalArgumentException("Body must be an array");
        if (body.size() > MAX_REPLACE_ROWS) throw new IllegalArgumentException("Too many rows (max " + MAX_REPLACE_ROWS + ")");
        List<D> rows = new ArrayList<>();
        for (JsonNode item : body) {
            if (!item.isObject()) throw new IllegalArgumentException("Body must be an array of objects");
            D row = read(service, collection, item);
            checkId(row.getId());
            rows.add(row);
        }
        return service.replaceAll(rows, actor, !admin);
    }

    private <D extends CollectionRow> D read(CollectionService<D> service, String collection, JsonNode node) {
        ObjectReader reader = objectMapper.readerFor(service.rowType()).with(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        D row;
        try {
            row = reader.treeToValue(node, service.rowType());
        } catch (UnrecognizedPropertyException e) {
            throw new IllegalArgumentException("Unknown field: " + e.getPropertyName());
        } catch (JsonProcessingException | IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid " + collection + " row");
        }
        Set<ConstraintViolation<D>> violations = validator.validate(row);
        if (!violations.isEmpty()) throw new ConstraintViolationException(violations);
        return row;
    }

    private static void checkId(String id) {
        if (id == null || !ID.matcher(id).matches()) throw new IllegalArgumentException("Invalid id: " + id);
    }
}
