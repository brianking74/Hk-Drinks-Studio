import ZAI from 'z-ai-web-dev-sdk';

async function test() {
  try {
    console.log('process.env keys:', Object.keys(process.env).filter(k => k.toLowerCase().includes('zai') || k.toLowerCase().includes('z_ai') || k.toLowerCase().includes('api')).slice(0, 20));
    console.log('All env keys count:', Object.keys(process.env).length);
    
    // Try to instantiate and inspect config
    const zai = await ZAI.create();
    console.log('ZAI instance:', typeof zai);
    console.log('ZAI keys:', Object.keys(zai));
    if (zai.config) {
      console.log('Config keys:', Object.keys(zai.config));
      // Don't print actual values
      console.log('Has baseUrl:', !!zai.config.baseUrl);
      console.log('Has apiKey:', !!zai.config.apiKey);
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}
test();
