import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

// Read the config the SDK auto-loaded
const zai = await ZAI.create();
console.log('baseUrl:', zai.config.baseUrl);
console.log('apiKey (first 10 + last 4):', zai.config.apiKey ? `${zai.config.apiKey.slice(0,10)}...${zai.config.apiKey.slice(-4)}` : 'NONE');
console.log('apiKey length:', zai.config.apiKey?.length);

// Write to .z-ai-config so it can be used on Vercel as env var
const config = {
  baseUrl: zai.config.baseUrl,
  apiKey: zai.config.apiKey,
  chatId: zai.config.chatId,
  userId: zai.config.userId,
};
console.log('\nConfig JSON (for Vercel env var ZAI_CONFIG):');
console.log(JSON.stringify(config));
