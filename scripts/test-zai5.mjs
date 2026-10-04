// Look at the actual SDK source to see how it auto-loads config
import fs from 'fs';
const src = fs.readFileSync('/home/z/my-project/node_modules/z-ai-web-dev-sdk/dist/index.js', 'utf8');
// Find the auto-config logic
const match = src.match(/(?:create|constructor|init)[\s\S]{0,2000}(?:config|apiKey|\.z-ai-config)[\s\S]{0,500}/i);
if (match) {
  console.log(match[0].slice(0, 2000));
} else {
  console.log('Searching for config loading...');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    if (line.match(/config|apiKey|\.z-ai-config|baseUrl|env\./i) && i < 200) {
      console.log(`${i}: ${line}`);
    }
  });
}
