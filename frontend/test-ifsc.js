const fetch = require('node-fetch'); // or use built-in fetch if Node 18+

async function test() {
  const res = await fetch('https://ifsc.in/api/v1/banks', {
    headers: { 'X-API-KEY': process.env.IFSC_API_KEY }
  });
  const data = await res.json();
  console.log(JSON.stringify(data).substring(0, 500));
}

test();
