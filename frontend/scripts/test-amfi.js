const fs = require('fs');

async function test() {
  console.time('fetch');
  const res = await fetch('https://www.amfiindia.com/spages/NAVAll.txt');
  const text = await res.text();
  console.timeEnd('fetch');
  
  console.log('Size:', text.length);
  
  console.time('parse');
  const lines = text.split('\n');
  const schemes = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.includes(';')) continue;
    const parts = line.split(';');
    if (parts.length >= 4 && !isNaN(parts[0])) {
      schemes.push({
        schemeCode: parts[0],
        schemeName: parts[3]
      });
    }
  }
  console.timeEnd('parse');
  
  console.log('Total schemes:', schemes.length);
  
  const query = 'Parag Parikh Flexi'.toLowerCase();
  const results = schemes.filter(s => s.schemeName.toLowerCase().includes(query));
  console.log('Search results for Parag Parikh Flexi:');
  console.log(results);
}

test();
