package com.xxxx.ddd.infrastructure.notification;

import com.xxxx.ddd.domain.service.notification.NotificationMailer;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/** SMTP (Gmail: smtp.gmail.com:587 + an App Password) configured through spring.mail.*; disabled while MAIL_HOST is empty. */
@Component
public class SmtpNotificationMailer implements NotificationMailer {
    private final ObjectProvider<JavaMailSender> sender;
    private final String host;
    private final String from;

    public SmtpNotificationMailer(ObjectProvider<JavaMailSender> sender, @Value("${spring.mail.host:}") String host,
                                  @Value("${spring.mail.username:}") String username, @Value("${notification.mail-from:}") String mailFrom) {
        this.sender = sender;
        this.host = host;
        this.from = mailFrom.isBlank() ? username : mailFrom;
    }

    @Override
    public boolean enabled() {
        return !host.isBlank() && sender.getIfAvailable() != null;
    }

    @Override
    public void send(String to, String subject, String html) {
        JavaMailSender mail = sender.getIfAvailable();
        if (mail == null || host.isBlank()) throw new MailSendException("Mail is not configured");
        try {
            MimeMessage message = mail.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            if (!from.isBlank()) helper.setFrom(from, "VLDC ERP");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mail.send(message);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            throw new MailSendException("Could not build e-mail", e);
        } catch (MailException e) {
            throw e;
        }
    }
}
