package com.urva.myfinance.coinTrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

import com.urva.myfinance.coinTrack.email.config.BrevoConfigProperties;

@SpringBootApplication
@EnableMongoAuditing
@EnableConfigurationProperties(BrevoConfigProperties.class)
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class FinanceDashboardApplication {

	public static void main(String[] args) {
		SpringApplication.run(FinanceDashboardApplication.class, args);
	}

}
