import ZAI from 'z-ai-web-dev-sdk';

async function test() {
  try {
    console.log('Creating ZAI instance...');
    const zai = await ZAI.create();
    console.log('ZAI created OK');
    
    console.log('Calling createVision...');
    const completion = await zai.chat.completions.createVision({
      model: 'glm-4.5v',
      messages: [
        { role: 'user', content: [
          { type: 'text', text: 'What is in this image?' },
          { type: 'image_url', image_url: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png' } },
        ]},
      ],
    });
    console.log('Response:', JSON.stringify(completion, null, 2).slice(0, 500));
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error('STACK:', err.stack);
  }
}
test();
