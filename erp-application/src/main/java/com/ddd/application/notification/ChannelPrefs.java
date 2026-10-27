package com.xxxx.ddd.application.notification;

/** Where one user gets one type of notification; leadMinutes is set for reminder types only. */
public record ChannelPrefs(boolean inApp, boolean email, Integer leadMinutes) {
    public boolean any() {
        return inApp || email;
    }
}
