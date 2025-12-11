let Groq;
let groq = null;

// Initialize Groq SDK - using dynamic import for ES module
(async () => {
  try {
    const GroqModule = await import('groq-sdk');
    Groq = GroqModule.default;
    
    if (!process.env.GROQ_API_KEY) {
      console.warn('⚠️  Warning: GROQ_API_KEY not found in .env file');
      return;
    }
    
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    console.log('✓ Groq SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Groq SDK:', error.message);
  }
})();

const systemPrompt = 'You are a professional e-commerce theme designer. Generate complete theme JSON for 12 pages: home, about, contact, shop, category, product, cart, checkout, signup, login, privacy, terms. Return ONLY valid JSON with structure: {plan, pages: {page: {type, layouts, defaultLayoutId}}}. For components pages: include id, name, plan (free/paid), components array. For layouts pages: include id, name, plan, meta object. Include 2 free and 3 paid layouts per page.';

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
        error: 'Groq API client not initialized. Please check your GROQ_API_KEY in .env file and restart the server.' 
      };
    }

    console.log('📤 Calling Groq API with message:', userMessage.substring(0, 50) + '...');

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
    console.log('📥 Groq response received, parsing JSON...');
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in Groq response:', content.substring(0, 100));
      return { 
        success: false, 
        error: 'Invalid response format from Groq API' 
      };
    }
    
    const themeData = JSON.parse(jsonMatch[0]);
    console.log('✓ Theme data parsed successfully');
    
    return { 
      success: true, 
      data: themeData 
    };
  } catch (error) {
    console.error('❌ Groq API Error:', error.message);
    console.error('Error type:', error.constructor.name);
    
    // Provide helpful error messages
    let errorMsg = error.message;
    if (error.message.includes('apiKey') || error.message.includes('authentication') || error.message.includes('401')) {
      errorMsg = 'Invalid or missing GROQ_API_KEY. Please verify your API key in .env file and restart the server.';
    } else if (error.message.includes('rate') || error.message.includes('429')) {
      errorMsg = 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (error.message.includes('timeout')) {
      errorMsg = 'Request timeout. Please check your internet connection and try again.';
    }
    
    return { 
      success: false, 
      error: errorMsg 
    };
  }
}

module.exports = { generateThemeWithGroq };
