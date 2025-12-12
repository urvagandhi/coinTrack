package com.urva.myfinance.coinTrack.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    public void sendOtp(String contact, String otp) {
        // In a real application, this would send an SMS or Email
        logger.info("========================================");
        logger.info("SENDING OTP TO: {}", contact);
        logger.info("OTP CODE: {}", otp);
        logger.info("========================================");
    }
}
