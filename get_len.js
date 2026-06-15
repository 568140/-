import * as fs from 'fs';
const len = fs.readFileSync('src/components/Dashboard.tsx', 'utf8').split('\n').length;
console.log('Real lines on disk for Dashboard.tsx:', len);
