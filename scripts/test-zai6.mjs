import fs from 'fs';
const src = fs.readFileSync('/home/z/my-project/node_modules/z-ai-web-dev-sdk/dist/index.js', 'utf8');
// Find the create method specifically
const createMatch = src.match(/static\s+async\s+create[\s\S]{0,1500}/);
if (createMatch) {
  console.log('=== create() method ===');
  console.log(createMatch[0]);
}
