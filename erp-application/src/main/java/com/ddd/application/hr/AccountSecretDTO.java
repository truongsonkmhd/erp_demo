package com.xxxx.ddd.application.hr;

/** Returned once, when an account is created or its password reset: the operator hands the password over. */
public record AccountSecretDTO(AccountDTO account, String temporaryPassword) {
}
