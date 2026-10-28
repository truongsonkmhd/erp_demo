package com.xxxx.ddd.application.exception;

/** The request clashes with the current state (wrong status for the action, duplicate code): HTTP 409. */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
