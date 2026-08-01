package com.urva.myfinance.coinTrack.mutualfund;

import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;
import com.urva.myfinance.coinTrack.mutualfund.model.*;
import com.urva.myfinance.coinTrack.mutualfund.repository.*;
import com.urva.myfinance.coinTrack.mutualfund.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.junit.jupiter.api.Disabled;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.math.BigDecimal;
import java.math.RoundingMode;

@SpringBootTest
@Disabled("Migration runner fails context load in tests")
public class MfDataMigrationRunnerTest {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private MfSchemeRepository mfSchemeRepository;
    @Autowired
    private LumpsumTransactionRepository lumpsumTransactionRepository;
    @Autowired
    private SipContributionRepository sipContributionRepository;
    @Autowired
    private RedemptionTransactionRepository redemptionTransactionRepository;
    @Autowired
    private PortfolioHoldingService portfolioHoldingService;
    @Autowired
    private MfNavService mfNavService;

    @Test
    public void runMigration() {
        System.out.println("Starting MF Data Migration for Krishil...");
        User user = userRepository.findByEmail("krishilgandhi30@gmail.com");
        if (user == null) {
            System.err.println("User not found!");
            return;
        }

        String userId = user.getId();
        
        // 1. Wipe data
        System.out.println("Wiping existing data...");
        mfSchemeRepository.findByUserId(userId).forEach(s -> mfSchemeRepository.delete(s));
        lumpsumTransactionRepository.findByUserId(userId).forEach(l -> lumpsumTransactionRepository.delete(l));
        sipContributionRepository.findByUserId(userId).forEach(s -> sipContributionRepository.delete(s));
        redemptionTransactionRepository.findByUserId(userId).forEach(r -> redemptionTransactionRepository.delete(r));

        // 2. Create Schemes
        Map<String, MfScheme> schemeMap = new HashMap<>();
        
        schemeMap.put("Parag Parekh", createScheme(userId, "Parag Parekh Flexi Cap Fund - Direct growth plan", "Flexi cap", "CAMS", "SBI", "10757672", "122639"));
        schemeMap.put("SBI Multicap", createScheme(userId, "SBI Multicap Fund - Direct Growth plan", "Multicap", "CAMS", "SBI", "29768466", "149174"));
        schemeMap.put("SBI Small Cap", createScheme(userId, "SBI Small Cap Fund - Direct Growth plan", "Small cap", "CAMS", "SBI", "29768466", "118778"));
        schemeMap.put("HDFC Multicap", createScheme(userId, "HDFC Multicap Fund - Direct growth plan", "Multicap", "CAMS", "SBI", "27471737/63", "149341"));
        schemeMap.put("Bandhan Small Cap", createScheme(userId, "Bandhan Small Cap Fund - Direct Growth plan", "Small cap", "CAMS", "SBI", "7089577", "147814"));
        schemeMap.put("HDFC Mid Cap", createScheme(userId, "HDFC Mid Cap Fund - Direct Growth plan", "Mid cap", "CAMS", "SBI", "27471737", "118989"));
        schemeMap.put("Mirae Large & Midcap", createScheme(userId, "Mirae Asset Large & Midcap Fund - Direct Growth plan", "Large & Mid cap", "Karvy", "SBI", "79935473441", "118834"));
        schemeMap.put("Mirae Midcap", createScheme(userId, "Mirae Asset Midcap Fund - Direct growth plan", "Mid cap", "Karvy", "SBI", "79935473441", "147708"));
        schemeMap.put("Canara Robeco", createScheme(userId, "Canara Robeco bluechip Fund - Direct growth plan", "Large cap", "Karvy", "SBI", "19926270126", "120373"));
        schemeMap.put("Motilal Oswal", createScheme(userId, "Motilal Oswal Large & Midcap Fund - Direct Growth plan", "Large & Mid cap", "Karvy", "SBI", "", "147602"));

        // 3. Add Lumpsums
        addLumpsum(userId, schemeMap.get("Parag Parekh"), "28-01-2021", 5000);
        addLumpsum(userId, schemeMap.get("Parag Parekh"), "07-05-2021", 5000);
        addLumpsum(userId, schemeMap.get("Parag Parekh"), "19-07-2021", 5000);
        addLumpsum(userId, schemeMap.get("Parag Parekh"), "07-12-2021", 10000);
        addLumpsum(userId, schemeMap.get("Parag Parekh"), "16-08-2024", 2000);
        addLumpsum(userId, schemeMap.get("Parag Parekh"), "20-11-2025", 30000);
        addLumpsum(userId, schemeMap.get("Parag Parekh"), "19-11-2025", 10000);
        addLumpsum(userId, schemeMap.get("Parag Parekh"), "20-07-2026", 100000);
        addLumpsum(userId, schemeMap.get("Parag Parekh"), "27-07-2026", 100000);

        addLumpsum(userId, schemeMap.get("Canara Robeco"), "30-03-2021", 5000);
        addLumpsum(userId, schemeMap.get("Canara Robeco"), "14-06-2021", 5000);
        addLumpsum(userId, schemeMap.get("Canara Robeco"), "14-06-2021", 3000);
        addLumpsum(userId, schemeMap.get("Canara Robeco"), "07-12-2021", 5000);
        addLumpsum(userId, schemeMap.get("Canara Robeco"), "20-01-2022", 3000);
        addLumpsum(userId, schemeMap.get("Canara Robeco"), "21-04-2022", 15000);

        addLumpsum(userId, schemeMap.get("Mirae Midcap"), "30-08-2021", 5000);
        addLumpsum(userId, schemeMap.get("Mirae Midcap"), "07-12-2021", 5000);
        addLumpsum(userId, schemeMap.get("Mirae Midcap"), "17-08-2023", 25000);
        addLumpsum(userId, schemeMap.get("Mirae Midcap"), "01-02-2024", 3000);
        addLumpsum(userId, schemeMap.get("Mirae Midcap"), "08-02-2024", 30000);
        addLumpsum(userId, schemeMap.get("Mirae Midcap"), "13-02-2024", 5000);

        addLumpsum(userId, schemeMap.get("SBI Multicap"), "09-05-2022", 10000);
        addLumpsum(userId, schemeMap.get("SBI Multicap"), "16-06-2022", 5000);
        addLumpsum(userId, schemeMap.get("SBI Multicap"), "17-11-2022", 5000);
        addLumpsum(userId, schemeMap.get("SBI Multicap"), "01-02-2024", 4000);

        addLumpsum(userId, schemeMap.get("HDFC Multicap"), "23-02-2024", 25000);
        addLumpsum(userId, schemeMap.get("Mirae Large & Midcap"), "07-08-2024", 25000);
        addLumpsum(userId, schemeMap.get("Mirae Large & Midcap"), "16-08-2024", 10000);

        addLumpsum(userId, schemeMap.get("Bandhan Small Cap"), "15-09-2025", 50000);
        addLumpsum(userId, schemeMap.get("Bandhan Small Cap"), "18-09-2025", 50000);
        addLumpsum(userId, schemeMap.get("Bandhan Small Cap"), "22-09-2025", 45000);
        addLumpsum(userId, schemeMap.get("Bandhan Small Cap"), "03-10-2025", 10000);
        addLumpsum(userId, schemeMap.get("Bandhan Small Cap"), "03-10-2025", 10000);
        addLumpsum(userId, schemeMap.get("Bandhan Small Cap"), "03-11-2025", 5000);
        addLumpsum(userId, schemeMap.get("Bandhan Small Cap"), "07-11-2025", 35000);
        addLumpsum(userId, schemeMap.get("Bandhan Small Cap"), "19-11-2025", 10000);

        addLumpsum(userId, schemeMap.get("HDFC Mid Cap"), "15-09-2025", 50000);
        addLumpsum(userId, schemeMap.get("HDFC Mid Cap"), "18-09-2025", 50000);
        addLumpsum(userId, schemeMap.get("HDFC Mid Cap"), "22-09-2025", 45000);
        addLumpsum(userId, schemeMap.get("HDFC Mid Cap"), "03-11-2025", 25000);
        addLumpsum(userId, schemeMap.get("HDFC Mid Cap"), "07-11-2025", 35000);
        addLumpsum(userId, schemeMap.get("HDFC Mid Cap"), "19-11-2025", 10000);

        // 4. Add SIPs programmatically (day of month is usually 5th based on images)
        generateSIPs(userId, schemeMap.get("Parag Parekh"), LocalDate.of(2021, 7, 5), LocalDate.of(2024, 5, 5), 3000);
        generateSIPs(userId, schemeMap.get("Parag Parekh"), LocalDate.of(2024, 6, 5), LocalDate.of(2026, 8, 5), 5000);
        
        generateSIPs(userId, schemeMap.get("SBI Multicap"), LocalDate.of(2022, 8, 5), LocalDate.of(2024, 5, 5), 4000);
        generateSIPs(userId, schemeMap.get("SBI Small Cap"), LocalDate.of(2023, 9, 5), LocalDate.of(2025, 8, 5), 5000);
        
        generateSIPs(userId, schemeMap.get("Mirae Large & Midcap"), LocalDate.of(2021, 3, 5), LocalDate.of(2025, 8, 5), 2500);
        generateSIPs(userId, schemeMap.get("Mirae Midcap"), LocalDate.of(2021, 10, 5), LocalDate.of(2024, 5, 5), 3000);
        generateSIPs(userId, schemeMap.get("Canara Robeco"), LocalDate.of(2021, 12, 5), LocalDate.of(2023, 5, 5), 3000);
        
        generateSIPs(userId, schemeMap.get("Bandhan Small Cap"), LocalDate.of(2025, 10, 5), LocalDate.of(2026, 8, 5), 5000);
        generateSIPs(userId, schemeMap.get("HDFC Mid Cap"), LocalDate.of(2025, 10, 5), LocalDate.of(2026, 8, 5), 5000);

        // 5. Add Redemptions
        addRedemption(userId, schemeMap.get("Canara Robeco"), "14-08-2023", 485.065, 75000.0);
        addRedemption(userId, schemeMap.get("Canara Robeco"), "08-02-2024", 509.516, 30000.30);
        addRedemption(userId, schemeMap.get("Canara Robeco"), "21-02-2024", 417.506, 25000.25);
        addRedemption(userId, schemeMap.get("Canara Robeco"), "13-06-2024", 261.213, 17237.45);
        
        addRedemption(userId, schemeMap.get("Mirae Midcap"), "18-06-2024", 270.5, 10000.10);
        addRedemption(userId, schemeMap.get("Mirae Midcap"), "07-08-2024", 660.055, 25000.00);
        addRedemption(userId, schemeMap.get("Mirae Midcap"), "12-08-2024", 655.177, 25000.00);
        addRedemption(userId, schemeMap.get("Mirae Midcap"), "16-08-2024", 653.089, 25000.25);
        addRedemption(userId, schemeMap.get("Mirae Midcap"), "21-08-2024", 639.082, 25000.25);
        addRedemption(userId, schemeMap.get("Mirae Midcap"), "23-08-2024", 639.769, 25000.25);
        addRedemption(userId, schemeMap.get("Mirae Midcap"), "26-08-2024", 635.734, 25000.00);
        addRedemption(userId, schemeMap.get("Mirae Midcap"), "12-02-2025", 755.386, 25000.25);
        addRedemption(userId, schemeMap.get("Mirae Midcap"), "10-09-2025", 1663.952, 66837.62);

        addRedemption(userId, schemeMap.get("SBI Multicap"), "29-07-2024", 1517.309, 25000.00);
        addRedemption(userId, schemeMap.get("SBI Multicap"), "30-07-2024", 1514.607, 25000.00);
        addRedemption(userId, schemeMap.get("SBI Multicap"), "31-07-2024", 1500.236, 25000.00);
        addRedemption(userId, schemeMap.get("SBI Multicap"), "05-08-2024", 1558.512, 25000.00);
        addRedemption(userId, schemeMap.get("SBI Multicap"), "16-08-2024", 1521.326, 25000.00);
        addRedemption(userId, schemeMap.get("SBI Multicap"), "11-02-2025", 1570.821, 25000.00);
        addRedemption(userId, schemeMap.get("SBI Multicap"), "10-09-2025", 2022.052, 35728.00);

        addRedemption(userId, schemeMap.get("HDFC Multicap"), "02-05-2025", 1480.355, 27227.00);
        
        addRedemption(userId, schemeMap.get("Mirae Large & Midcap"), "18-09-2025", 576.424, 100000.00);
        addRedemption(userId, schemeMap.get("Mirae Large & Midcap"), "22-09-2025", 522.878, 90000.00);
        addRedemption(userId, schemeMap.get("Mirae Large & Midcap"), "03-10-2025", 111.576, 19000.00);

        addRedemption(userId, schemeMap.get("SBI Small Cap"), "03-11-2025", 149.28, 30000.00);
        addRedemption(userId, schemeMap.get("SBI Small Cap"), "07-11-2025", 354.77, 70000.00);
        addRedemption(userId, schemeMap.get("SBI Small Cap"), "29-06-2026", 121.891, 25000.00);

        addRedemption(userId, schemeMap.get("Parag Parekh"), "20-11-2025", 318.893, 30000.00);
        addRedemption(userId, schemeMap.get("Parag Parekh"), "20-07-2026", 1096.3, 100000.00);
        addRedemption(userId, schemeMap.get("Parag Parekh"), "27-07-2026", 1101.269, 99500.00);

        // 6. Recalculate Portfolio Holdings
        System.out.println("Updating holding caches...");
        for (MfScheme scheme : schemeMap.values()) {
            portfolioHoldingService.updateHoldingForScheme(userId, scheme.getId());
        }

        System.out.println("MIGRATION COMPLETE!");
    }

    private MfScheme createScheme(String userId, String name, String category, String platform, String bank, String folio, String amfiCode) {
        MfScheme s = new MfScheme();
        s.setUserId(userId);
        s.setSchemeName(name);
        s.setHolderName("Krishil");
        s.setFolioNo(folio);
        s.setBank(bank);
        s.setPlatform(platform);
        s.setAmfiCode(amfiCode); // Required for auto NAV
        return mfSchemeRepository.save(s);
    }

    private void addLumpsum(String userId, MfScheme scheme, String dateStr, double amount) {
        LumpsumTransaction lt = new LumpsumTransaction();
        lt.setUserId(userId);
        lt.setSchemeId(scheme.getId());
        lt.setDebitedBank(scheme.getBank());
        lt.setInvestmentDate(LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("dd-MM-yyyy")));
        
        BigDecimal amt = BigDecimal.valueOf(amount);
        lt.setLumpsumInvestment(amt);
        
        BigDecimal nav = mfNavService.fetchNavForDate(scheme.getAmfiCode(), lt.getInvestmentDate());
        if (nav != null) {
            lt.setNavPrice(nav);
            lt.setTotalUnit(amt.divide(nav, 4, RoundingMode.HALF_UP));
        }
        lumpsumTransactionRepository.save(lt);
    }

    private void addRedemption(String userId, MfScheme scheme, String dateStr, double units, double value) {
        RedemptionTransaction rt = new RedemptionTransaction();
        rt.setUserId(userId);
        rt.setSchemeId(scheme.getId());
        rt.setRedemptionDate(LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("dd-MM-yyyy")));
        
        BigDecimal u = BigDecimal.valueOf(units);
        BigDecimal v = BigDecimal.valueOf(value);
        
        rt.setRedemptionUnit(u);
        rt.setRedemptionValue(v);
        
        BigDecimal nav = mfNavService.fetchNavForDate(scheme.getAmfiCode(), rt.getRedemptionDate());
        if (nav != null) {
            rt.setRedemptionNav(nav);
        } else {
            rt.setRedemptionNav(v.divide(u, 4, RoundingMode.HALF_UP));
        }
        redemptionTransactionRepository.save(rt);
    }

    private void generateSIPs(String userId, MfScheme scheme, LocalDate start, LocalDate end, double amount) {
        LocalDate current = start;
        BigDecimal amt = BigDecimal.valueOf(amount);
        while (!current.isAfter(end)) {
            SipContribution sc = new SipContribution();
            sc.setUserId(userId);
            sc.setSchemeId(scheme.getId());
            sc.setContributionDate(current);
            sc.setAmount(amt);
            
            BigDecimal nav = mfNavService.fetchNavForDate(scheme.getAmfiCode(), current);
            if (nav != null && nav.compareTo(BigDecimal.ZERO) != 0) {
                sc.setNavPrice(nav);
                sc.setTotalUnit(amt.divide(nav, 4, RoundingMode.HALF_UP));
            }
            sipContributionRepository.save(sc);
            
            current = current.plusMonths(1);
        }
    }
}
