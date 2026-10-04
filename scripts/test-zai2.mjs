import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function test() {
  try {
    const buf = fs.readFileSync('/home/z/my-project/scripts/test-drink.jpg');
    const b64 = buf.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${b64}`;
    console.log('Image size:', buf.length, 'bytes');
    console.log('Data URL length:', dataUrl.length);
    
    const zai = await ZAI.create();
    console.log('Calling createVision with real image...');
    const completion = await zai.chat.completions.createVision({
      model: 'glm-4.5v',
      messages: [
        { role: 'user', content: [
          { type: 'text', text: 'Describe this image in one sentence.' },
          { type: 'image_url', image_url: { url: dataUrl } },
        ]},
      ],
    });
    console.log('Response:', completion?.choices?.[0]?.message?.content);
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}
test();
