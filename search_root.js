import * as fs from 'fs';
import * as path from 'path';

function findOriginalBySearching(dir, result = []) {
  if (dir.startsWith('/proc') || dir.startsWith('/sys') || dir.startsWith('/dev') || dir.startsWith('/run') || dir.includes('node_modules')) {
    return null;
  }
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (file.toLowerCase().includes('dashboard.tsx')) {
        try {
          const stat = fs.statSync(fullPath);
          result.push({ path: fullPath, size: stat.size });
        } catch(e) {}
      }
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          findOriginalBySearching(fullPath, result);
        }
      } catch(e) {}
    }
  } catch(e) {}
  return result;
}

// Search root system paths where clones are stored
const results = [];
findOriginalBySearching('/app', results);
findOriginalBySearching('/home', results);
findOriginalBySearching('/root', results);
findOriginalBySearching('/workspace', results);
findOriginalBySearching('/usr/src', results);
findOriginalBySearching('/opt', results);

console.log('Found Dashboard results:', results);
