const fs = require('fs');
const content = fs.readFileSync('src/components/dashboard-content.tsx', 'utf8');
const lines = content.split('\n');
const start = parseInt(process.argv[2] || 0);
const end = parseInt(process.argv[3] || 200);
console.log(lines.slice(start, end).join('\n'));
