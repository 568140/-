import * as fs from 'fs';
import * as path from 'path';

function deepSearch(dir, depth = 0) {
  if (depth > 12) return null;
  if (dir.startsWith('/proc') || dir.startsWith('/sys') || dir.startsWith('/dev') || dir.startsWith('/run') || dir.includes('node_modules')) {
    return null;
  }
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (file === 'transcript.jsonl') {
        return fullPath;
      }
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const res = deepSearch(fullPath, depth + 1);
          if (res) return res;
        }
      } catch (e) {}
    }
  } catch (e) {}
  return null;
}

// We start search from the physical host/container root '/'
const found = deepSearch('/');
if (found) {
  console.log('DEEP FOUND log file:', found);
} else {
  console.log('No transcript file found anywhere on the entire system.');
}
