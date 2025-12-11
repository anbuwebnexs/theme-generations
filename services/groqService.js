const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const systemPrompt = 'You are a professional e-commerce theme designer. Generate complete theme JSON for 12 pages: home, about, contact, shop, category, product, cart, checkout, signup, login, privacy, terms. Return ONLY valid JSON with structure: {plan, pages: {page: {type, layouts, defaultLayoutId}}}. Include 2 free and 3 paid layouts per page.';

async function generateThemeWithGroq(userMessage, selectedPlan) {
  try {
    const response = await groq.messages.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Plan: ${selectedPlan}. Request: ${userMessage}. Generate complete theme JSON.`
        }
      ]
    });

    const content = response.content[0].text.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    
    const themeData = JSON.parse(jsonMatch[0]);
    return { success: true, data: themeData };
  } catch (error) {
    console.error('Groq Error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { generateThemeWithGroq };
