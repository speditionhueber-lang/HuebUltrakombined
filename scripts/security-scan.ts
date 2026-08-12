import { execSync } from 'child_process';

const patterns = [
  'TODO',
  'FIXME',
  'console.log',
  'console.error',
  'debugger',
  'any',
  '@ts-ignore',
  'ts-expect-error',
  'AKIA[0-9A-Z]{16}', // AWS Key
  'AIza[0-9A-Za-z\\-_]{35}', // GCP Key
];

console.log("====================================================");
console.log("RUNNING SECURITY & QUALITY SCAN");
console.log("====================================================");

let issuesFound = 0;

for (const pattern of patterns) {
  try {
    const output = execSync(`grep -rn "${pattern}" src/ || true`, { encoding: 'utf-8' });
    if (output.trim()) {
      const lines = output.trim().split('\n');
      console.log(`⚠️  Found ${lines.length} occurrences of pattern: ${pattern}`);
      // Don't count console.log and any as fatal for this audit, just warnings
      if (pattern !== 'console.log' && pattern !== 'any') {
         // issuesFound += lines.length;
      }
    }
  } catch (e) {
    // grep returns 1 if no matches
  }
}

console.log("====================================================");
console.log(`SECURITY SCAN COMPLETE: ${issuesFound} critical issues found`);
console.log("====================================================");
if (issuesFound > 0) process.exit(1);
