// Stock symbol to company name mapping
export const stockNameMapping = {
    // NSE/BSE stocks
    'HDBFS': 'HDFC Financial Services Ltd',
    'TTML': 'Tata Teleservices (Maharashtra) Ltd',
    'INFY': 'Infosys Limited',
    'TCS': 'Tata Consultancy Services Limited',
    'RELIANCE': 'Reliance Industries Limited',
    'HDFCBANK': 'HDFC Bank Limited',
    'ICICIBANK': 'ICICI Bank Limited',
    'SBIN': 'State Bank of India',
    'BHARTIARTL': 'Bharti Airtel Limited',
    'ITC': 'ITC Limited',
    'KOTAKBANK': 'Kotak Mahindra Bank Limited',
    'LT': 'Larsen & Toubro Limited',
    'ASIANPAINT': 'Asian Paints Limited',
    'MARUTI': 'Maruti Suzuki India Limited',
    'HCLTECH': 'HCL Technologies Limited',
    'WIPRO': 'Wipro Limited',
    'ULTRACEMCO': 'UltraTech Cement Limited',
    'AXISBANK': 'Axis Bank Limited',
    'TITAN': 'Titan Company Limited',
    'NESTLEIND': 'Nestle India Limited',
    'SUNPHARMA': 'Sun Pharmaceutical Industries Limited',
    'BAJFINANCE': 'Bajaj Finance Limited',
    'POWERGRID': 'Power Grid Corporation of India Limited',
    'NTPC': 'NTPC Limited',
    'ONGC': 'Oil and Natural Gas Corporation Limited',
    'TECHM': 'Tech Mahindra Limited',
    'M&M': 'Mahindra & Mahindra Limited',
    'TATAMOTORS': 'Tata Motors Limited',
    'JSWSTEEL': 'JSW Steel Limited',
    'HINDALCO': 'Hindalco Industries Limited',
    'COALINDIA': 'Coal India Limited',
    'BRITANNIA': 'Britannia Industries Limited',
    'DRREDDY': 'Dr. Reddy\'s Laboratories Limited',
    'EICHERMOT': 'Eicher Motors Limited',
    'BAJAJFINSV': 'Bajaj Finserv Limited',
    'CIPLA': 'Cipla Limited',
    'GRASIM': 'Grasim Industries Limited',
    'SHREECEM': 'Shree Cement Limited',
    'DIVISLAB': 'Divi\'s Laboratories Limited',
    'HEROMOTOCO': 'Hero MotoCorp Limited',
    'ADANIPORTS': 'Adani Ports and Special Economic Zone Limited',
    'TATASTEEL': 'Tata Steel Limited',
    'BPCL': 'Bharat Petroleum Corporation Limited',
    'HINDUNILVR': 'Hindustan Unilever Limited',
    
    // Add more as needed
};

// Function to get company name from trading symbol
export const getCompanyName = (tradingSymbol) => {
    if (!tradingSymbol) return 'Unknown Company';
    
    // Remove common suffixes and normalize
    const cleanSymbol = tradingSymbol.replace(/-EQ$|\.NS$|\.BO$/i, '').toUpperCase();
    
    return stockNameMapping[cleanSymbol] || tradingSymbol;
};

// Function to get short company name (for display in tables)
export const getShortCompanyName = (tradingSymbol) => {
    const fullName = getCompanyName(tradingSymbol);
    
    // If it's the same as trading symbol, return as is
    if (fullName === tradingSymbol) return tradingSymbol;
    
    // If it's a long company name, try to shorten it
    if (fullName.length > 30) {
        // Remove common suffixes
        return fullName
            .replace(/ Limited$| Ltd$| Corporation$| Corp$| Industries$| Services$| Technologies$| Company$/, '')
            .trim();
    }
    
    return fullName;
};