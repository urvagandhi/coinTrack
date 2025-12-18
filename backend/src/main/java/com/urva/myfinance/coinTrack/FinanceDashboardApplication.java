package com.urva.myfinance.coinTrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

import com.urva.myfinance.coinTrack.email.config.BrevoConfigProperties;

@SpringBootApplication
@EnableMongoAuditing
@EnableConfigurationProperties(BrevoConfigProperties.class)
public class FinanceDashboardApplication {

	public static void main(String[] args) {
		SpringApplication.run(FinanceDashboardApplication.class, args);
	}

}
