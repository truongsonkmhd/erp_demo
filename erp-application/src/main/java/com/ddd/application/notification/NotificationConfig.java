package com.xxxx.ddd.application.notification;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableScheduling
@EnableAsync
@EnableConfigurationProperties(NotificationProperties.class)
public class NotificationConfig {
    public static final String EXECUTOR = "notificationExecutor";

    /** E-mails go out here so a slow SMTP server never holds up a request or the reminder job. */
    @Bean(EXECUTOR)
    public Executor notificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(1000);
        executor.setThreadNamePrefix("notify-");
        executor.initialize();
        return executor;
    }
}
