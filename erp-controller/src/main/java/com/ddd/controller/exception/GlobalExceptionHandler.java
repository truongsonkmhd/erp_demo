package com.xxxx.ddd.controller.exception;

import com.xxxx.ddd.application.exception.NotFoundException;
import com.xxxx.ddd.controller.model.enums.ResultUtil;
import com.xxxx.ddd.controller.model.vo.ResultMessage;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.TypeMismatchException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

/** Safety net for controllers without their own try/catch: ResultMessage body with the matching HTTP status. */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ResultMessage<Object>> badRequest(IllegalArgumentException e) {
        return error(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    /** spring.servlet.multipart limits, hit before the controller runs. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ResultMessage<Object>> tooLarge(MaxUploadSizeExceededException e) {
        return error(HttpStatus.PAYLOAD_TOO_LARGE, "File quá dung lượng cho phép (tối đa 20 MB mỗi file)");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResultMessage<Object>> invalidBody(MethodArgumentNotValidException e) {
        FieldError field = e.getBindingResult().getFieldError();
        String message = field == null ? "Invalid request" : field.getField() + ": " + field.getDefaultMessage();
        return error(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ResultMessage<Object>> constraintViolation(ConstraintViolationException e) {
        String message = e.getConstraintViolations().stream()
                .findFirst()
                .map(GlobalExceptionHandler::describe)
                .orElse("Invalid request");
        return error(HttpStatus.BAD_REQUEST, message);
    }

    /** e.g. GET /api/users/abc on a Long path variable; Spring returned 400 for these before this handler existed. */
    @ExceptionHandler({TypeMismatchException.class, BindException.class})
    public ResponseEntity<ResultMessage<Object>> badParameter(Exception e) {
        return error(HttpStatus.BAD_REQUEST, "Invalid request parameter");
    }

    /** Two writers raced on the same rows (duplicate key on insert, deadlock on replaceAll): the client may retry. */
    @ExceptionHandler({DataIntegrityViolationException.class, PessimisticLockingFailureException.class})
    public ResponseEntity<ResultMessage<Object>> conflict(Exception e) {
        log.warn("Write conflict: {}", e.getMessage());
        return error(HttpStatus.CONFLICT, "Conflicting concurrent update, please retry");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ResultMessage<Object>> unreadable(HttpMessageNotReadableException e) {
        return error(HttpStatus.BAD_REQUEST, "Invalid request body");
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ResultMessage<Object>> notFound(NotFoundException e) {
        return error(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ResultMessage<Object>> forbidden(AccessDeniedException e) {
        return error(HttpStatus.FORBIDDEN, "Forbidden");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResultMessage<Object>> unexpected(Exception e) {
        // Spring MVC's own errors (no route 404, wrong method 405, bad media type 415...) keep their status.
        if (e instanceof ErrorResponse springError) {
            HttpStatusCode status = springError.getStatusCode();
            return ResponseEntity.status(status).body(ResultUtil.error(status.value(), e.getMessage()));
        }
        log.error("Unhandled exception", e);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
    }

    private static String describe(ConstraintViolation<?> violation) {
        return violation.getPropertyPath() + ": " + violation.getMessage();
    }

    private static ResponseEntity<ResultMessage<Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(ResultUtil.error(status.value(), message));
    }
}
