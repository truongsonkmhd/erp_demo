package com.xxxx.ddd.application.vldc;

import java.util.List;

/** Rows of a VLDC collection changed; replaced = the whole collection was rewritten (seed/reset). Sent to clients after commit. */
public record CollectionChangedEvent(String collection, List<String> ids, boolean replaced) {
}
