import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const code = searchParams.get('code');

  if (!type) {
    return NextResponse.json(
      { status: false, message: 'Type is required' },
      { status: 400 }
    );
  }

  if (type !== 'all_banks' && !code) {
    return NextResponse.json(
      { status: false, message: 'Code is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.IFSC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { status: false, message: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    let url = '';
    if (type === 'ifsc') {
      url = `https://ifsc.in/api/v1/lookup/${code}`;
    } else if (type === 'bankcode') {
      // Fetch 1 branch of this bank to get the bank name
      url = `https://ifsc.in/api/v1/bank/${code}?limit=1`;
    } else if (type === 'all_banks') {
      // The ifsc.in /api/v1/banks endpoint doesn't actually exist despite the docs.
      // We will fallback to Razorpay's open source banknames.json to populate the dropdown.
      const response = await fetch("https://raw.githubusercontent.com/razorpay/ifsc/master/src/banknames.json");
      const bankMap = await response.json();
      
      const banksList = Object.entries(bankMap).map(([code, name]) => ({
        bank_code: code,
        bank_name: name
      }));

      return NextResponse.json({
        status: true,
        data: {
          total_banks: banksList.length,
          banks: banksList
        }
      });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      // Pass rate limits or other errors through
      return NextResponse.json(
        data,
        { status: response.status !== 200 ? response.status : 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching IFSC data:', error);
    return NextResponse.json(
      { status: false, message: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
