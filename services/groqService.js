// Groq REST API Service - using llama-3.1-8b-instant model
const https = require('https');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama-3.1-8b-instant';

const systemPrompt = 'You are a professional e-commerce theme designer. Generate complete theme JSON for 12 pages: home, about, contact, shop, category, product, cart, checkout, signup, login, privacy, terms. Return ONLY valid JSON with structure: {plan, pages: {page: {type, layouts, defaultLayoutId}}}. For components pages: include id, name, plan (free/paid), components array. For layouts pages: include id, name, plan, meta object. Include 2 free and 3 paid layouts per page.';

// Validate API key on startup
if (!GROQ_API_KEY) {
  console.warn('⚠️  Warning: GROQ_API_KEY not found in .env file');
} else {
  console.log('✓ Groq API Key loaded successfully');
}

async function callGroqAPI(userMessage, selectedPlan) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Plan: ${selectedPlan}. User request: ${userMessage}. Generate complete theme JSON for all 12 pages.`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    const req = https.request(GROQ_API_URL, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          // Check for API errors
          if (response.error) {
            reject(new Error(`Groq API Error: ${response.error.message}`));
            return;
          }

          if (!response.choices || !response.choices[0]) {
            reject(new Error('Invalid response format from Groq API'));
            return;
          }

          const content = response.choices[0].message.content.trim();
          resolve(content);
        } catch (err) {
          reject(new Error(`Failed to parse Groq response: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });

    req.write(requestData);
    req.end();
  });
}

async function generateThemeWithGroq(userMessage, selectedPlan) {
  try {
    // Validate inputs
    if (!userMessage || !selectedPlan) {
      return { 
        success: false, 
        error: 'Message and plan are required' 
      };
    }

    // Validate API key
    if (!GROQ_API_KEY) {
      return { 
        success: false, 
        error: 'Groq API key not configured. Please set GROQ_API_KEY in .env file.' 
      };
    }

    console.log('📤 Calling Groq API with llama-3.1-8b-instant...');
    console.log(`   Model: ${MODEL}`);
    console.log(`   Plan: ${selectedPlan}`);
    console.log(`   Message: ${userMessage.substring(0, 60)}...`);

    const content = await callGroqAPI(userMessage, selectedPlan);
    console.log('📥 Groq response received, parsing JSON...');
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in response:', content.substring(0, 100));
      return { 
        success: false, 
        error: 'Invalid response format from Groq API' 
      };
    }
    
    const themeData = JSON.parse(jsonMatch[0]);
    console.log('✓ Theme data parsed successfully');
    console.log(`   Pages generated: ${Object.keys(themeData.pages || {}).length}`);
    
    return { 
      success: true, 
      data: themeData 
    };
  } catch (error) {
    console.error('❌ Groq API Error:', error.message);
    
    // Provide helpful error messages
    let errorMsg = error.message;
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      errorMsg = 'Invalid Groq API key. Please verify your API key in .env file.';
    } else if (error.message.includes('429') || error.message.includes('rate')) {
      errorMsg = 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (error.message.includes('timeout')) {
      errorMsg = 'Request timeout. Please check your internet connection.';
    } else if (error.message.includes('ECONNREFUSED')) {
      errorMsg = 'Connection refused. Please verify your internet connection.';
    }
    
    return { 
      success: false, 
      error: errorMsg 
    };
  }
}

module.exports = { generateThemeWithGroq };
