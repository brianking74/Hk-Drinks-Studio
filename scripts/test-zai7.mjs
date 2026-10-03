import fs from 'fs';
const src = fs.readFileSync('/home/z/my-project/node_modules/z-ai-web-dev-sdk/dist/index.js', 'utf8');
// Find loadConfig function
const match = src.match(/async\s+function\s+loadConfig[\s\S]{0,2000}/);
if (match) {
  console.log('=== loadConfig() ===');
  console.log(match[0]);
} else {
  const match2 = src.match(/loadConfig\s*=[\s\S]{0,2000}/);
  if (match2) {
    console.log('=== loadConfig ===');
    console.log(match2[0]);
  }
}
