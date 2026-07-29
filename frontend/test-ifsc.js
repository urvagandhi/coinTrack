const fetch = require('node-fetch'); // or use built-in fetch if Node 18+
async function test() {
  const res = await fetch('https://ifsc.in/api/v1/banks', {
    headers: { 'X-API-KEY': '4f39b48db03d6ed23c403602e79b4a5a3ff2a909f248394c37c15e33457bd2d9' }
  });
  const data = await res.json();
  console.log(JSON.stringify(data).substring(0, 500));
}
test();
