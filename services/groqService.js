const Groq = require('groq-sdk').default || require('groq-sdk');

// Initialize Groq client
let groq;

try {
  if (!process.env.GROQ_API_KEY) {
    console.warn('Warning: GROQ_API_KEY not found in .env file');
  }
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
} catch (error) {
  console.error('Failed to initialize Groq:', error.message);
}

const systemPrompt = `You are a professional e-commerce theme designer. Generate complete theme JSON for 12 pages: home, about, contact, shop, category, product, cart, checkout, signup, login, privacy, terms. Return ONLY valid JSON with structure: {plan, pages: {page: {type, layouts, defaultLayoutId}}}. For components pages: include id, name, plan (free/paid), components array. For layouts pages: include id, name, plan, meta object. Include 2 free and 3 paid layouts per page.`;

async function generateThemeWithGroq(userMessage, selectedPlan) {
  try {
    // Validate inputs
    if (!userMessage || !selectedPlan) {
      return { 
        success: false, 
        error: 'Message and plan are required' 
      };
    }

    // Check if Groq is initialized
    if (!groq) {
      return { 
        success: false, 
        error: 'Groq API client not initialized. Please check your GROQ_API_KEY in .env file' 
      };
    }

    console.log('Calling Groq API with message:', userMessage.substring(0, 50) + '...');

    const response = await groq.messages.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Plan: ${selectedPlan}. User request: ${userMessage}. Generate complete theme JSON for all 12 pages.`
        }
      ]
    });

    const content = response.content[0].text.trim();
    console.log('Groq response received, parsing JSON...');
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Groq response:', content.substring(0, 100));
      return { 
        success: false, 
        error: 'Invalid response format from Groq API' 
      };
    }
    
    const themeData = JSON.parse(jsonMatch[0]);
    console.log('Theme data parsed successfully');
    
    return { 
      success: true, 
      data: themeData 
    };
  } catch (error) {
    console.error('Groq API Error:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide helpful error messages
    let errorMsg = error.message;
    if (error.message.includes('apiKey') || error.message.includes('authentication')) {
      errorMsg = 'Invalid or missing GROQ_API_KEY. Please check your .env file.';
    } else if (error.message.includes('rate')) {
      errorMsg = 'Rate limit exceeded. Please try again in a moment.';
    }
    
    return { 
      success: false, 
      error: errorMsg 
    };
  }
}

module.exports = { generateThemeWithGroq };
