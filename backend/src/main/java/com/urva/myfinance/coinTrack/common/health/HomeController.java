package com.urva.myfinance.coinTrack.common.health;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String home() {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><title>CoinTrack API</title>");
        sb.append("<meta charset='utf-8'><style>");
        sb.append("body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f7f6;margin:0;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;text-align:center;} ");
        sb.append("img{max-width:250px;margin-bottom:30px;} ");
        sb.append("h1{font-size:2.5rem;color:#2c3e50;margin:0 0 15px 0;} ");
        sb.append(".description{max-width:600px;color:#555;font-size:1.1rem;line-height:1.6;margin:0 auto 20px auto;} ");
        sb.append("p{color:#7f8c8d;font-size:1.2rem;margin:0 0 40px 0;} ");
        sb.append(".btn{display:inline-block;padding:12px 30px;background-color:#007bff;color:#fff;text-decoration:none;border-radius:30px;font-size:1.1rem;font-weight:600;transition:all 0.2s;margin:0 10px;} ");
        sb.append(".btn:hover{background-color:#0056b3;transform:translateY(-2px);box-shadow:0 4px 10px rgba(0,123,255,0.3);} ");
        sb.append("</style></head><body>");
        sb.append("<img src='/favicon.ico' alt='CoinTrack Logo'/>");
        sb.append("<h1>CoinTrack API is running!</h1>");
        sb.append("<div class='description'>CoinTrack is a comprehensive multi-broker portfolio tracking and personal finance management platform designed to help you monitor and optimize your investments across different brokers in one unified dashboard.</div>");
        sb.append("<p>Version: 2.0.0</p>");
        sb.append("<div>");
        sb.append("<a href='/api/health' class='btn'>Detailed Health Check</a>");
        sb.append("<a href='/actuator' class='btn'>Actuator Endpoints</a>");
        sb.append("</div>");
        sb.append("</body></html>");
        
        return sb.toString();
    }

    @GetMapping(value = "/favicon.ico", produces = MediaType.IMAGE_PNG_VALUE)
    @ResponseBody
    public ResponseEntity<Resource> returnFavicon() {
        Resource resource = new ClassPathResource("static/logo/coinTrack.png");
        if (resource.exists()) {
            return ResponseEntity.ok().body(resource);
        }
        return ResponseEntity.noContent().build();
    }
}

