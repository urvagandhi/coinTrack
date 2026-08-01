import { NextResponse } from 'next/server';

// In-memory cache for parsed schemes to make search ultra-fast (sub-millisecond)
let cachedSchemes = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 3) {
    return NextResponse.json([]);
  }

  try {
    const now = Date.now();
    // If cache is empty or expired, fetch and parse the text file
    if (!cachedSchemes || now - lastFetchTime > CACHE_TTL_MS) {
      const res = await fetch('https://www.amfiindia.com/spages/NAVAll.txt', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/plain,*/*'
        },
        cache: 'no-store'
      });
      
      if (!res.ok) {
        throw new Error(`AMFI API returned status: ${res.status}`);
      }
      
      const text = await res.text();
      const lines = text.split('\n');
      const parsed = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || !line.includes(';')) continue;
        
        const parts = line.split(';');
        // Format: Scheme Code;ISIN Div;ISIN Growth;Scheme Name;NAV;Date
        if (parts.length >= 4 && !isNaN(parts[0])) {
          parsed.push({
            schemeCode: parts[0],
            schemeName: parts[3],
            searchName: parts[3].toLowerCase() // Pre-compute lowercase for faster filtering
          });
        }
      }
      
      cachedSchemes = parsed;
      lastFetchTime = now;
    }
    
    // Now just filter the pre-parsed in-memory array instantly
    const queryLower = q.toLowerCase();
    const results = [];
    
    for (let i = 0; i < cachedSchemes.length; i++) {
      if (cachedSchemes[i].searchName.includes(queryLower)) {
        results.push({
          schemeCode: cachedSchemes[i].schemeCode,
          schemeName: cachedSchemes[i].schemeName
        });
        
        // Limit to 50 results to keep the response fast and payload small
        if (results.length >= 50) {
          break;
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to search AMFI NAVAll.txt:', error);
    return NextResponse.json(
      { error: 'Failed to search mutual funds' },
      { status: 500 }
    );
  }
}
