package com.xxxx.ddd.application.hr;

import java.util.List;

/** Choices for the account forms; employees = working people who have no account yet. */
public record AccountOptionsDTO(List<Option> roles, List<Option> positions, List<Person> employees) {
    public record Option(String code, String name) {
    }

    public record Person(String code, String name, String unit, String title, String email) {
    }
}
