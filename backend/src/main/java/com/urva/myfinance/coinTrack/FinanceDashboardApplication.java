package com.urva.myfinance.coinTrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class FinanceDashboardApplication {

	public static void main(String[] args) {
		SpringApplication.run(FinanceDashboardApplication.class, args);
	}

}
