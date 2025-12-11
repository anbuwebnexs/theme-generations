// Groq REST API Service - Conversational Theme Generator with Session Support
const https = require('https');
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama-3.1-8b-instant';

// Page definitions
const COMPONENT_PAGES = ['home', 'about', 'contact', 'signup', 'login', 'privacy', 'terms'];
const LAYOUT_PAGES = ['shop', 'category', 'product', 'cart', 'checkout'];

// Default component mapping for each page
const DEFAULT_COMPONENTS = {
  home: ['heroimageslider', 'productslider', 'categoryslider', 'promobanner', 'newsletter'],
  about: ['heroimageslider', 'imagetextcolumn', 'categoryslider', 'testimonials'],
  contact: ['heroimageslider', 'contactform', 'contactinfo', 'faqaccordion'],
  signup: ['heroimageslider', 'signup', 'newsletter'],
  login: ['heroimageslider', 'loginform'],
  privacy: ['heroimageslider', 'textcontent', 'faqaccordion'],
  terms: ['heroimageslider', 'textcontent', 'faqaccordion']
};

if (!GROQ_API_KEY) {
  console.warn('⚠️ Warning: GROQ_API_KEY not found in .env file');
} else {
  console.log('✓ Groq API Key loaded successfully');
}

// Call Groq LLM API
async function callGroqAPI(prompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.choices[0].message.content);
        } catch (e) {
          reject(new Error(`Failed to parse Groq response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Load actual component JSON from data folder
async function loadPageComponents(pageName) {
  try {
    const path = require('path');
    const fs = require('fs').promises;
    const filePath = path.join(__dirname, `../data/pages/${pageName}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    const pageData = JSON.parse(data);
    return pageData.components || [];
  } catch (error) {
    console.warn(`Could not load ${pageName}.json:`, error.message);
    return [];
  }
}

// Get layout for a page based on analysis
function getLayoutForPage(pageName, layoutAnalysis) {
  const layoutNum = layoutAnalysis[`${pageName}_layout`] || 2;
  const isPro = layoutNum > 2;
  
  const layoutNames = {
    shop: ['Grid', 'List', 'Masonry', 'Hero + Grid', 'Sidebar + Main'],
    category: ['Grid', 'List', 'Masonry', 'Hero + Grid', 'Sidebar + Main'],
    product: ['Hero Slider', 'List', 'Detailed', 'Comparison', 'Featured'],
    cart: ['Simple', 'Detailed', 'Mini', 'Fullpage', 'Checkout Preview'],
    checkout: ['Steps', 'Single Page', 'Multi Step', 'Express', 'Full Flow']
  };

  return {
    page_name: pageName,
    page_title: pageName.charAt(0).toUpperCase() + pageName.slice(1),
    layout_number: layoutNum,
    layout_name: (layoutNames[pageName] && layoutNames[pageName][layoutNum - 1]) || `Layout ${layoutNum}`,
    plan: isPro ? 'pro' : 'free',
    ejs_file: `${pageName}/layout_${layoutNum}`,
    css_file: `${pageName}/layout_${layoutNum}`,
    js_file: `${pageName}/layout_${layoutNum}`,
    description: `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} page with ${isPro ? 'Pro' : 'Free'} layout`,
    preview_image: `https://imagedelivery.net/placeholder-${pageName}-layout-${layoutNum}.jpg`
  };
}

// Main function: Generate theme with Groq analysis
async function generateThemeWithGroq(userMessage, selectedPlan, conversationHistory = []) {
  try {
    if (!userMessage || !selectedPlan) {
      return {
        success: false,
        error: 'Message and plan are required'
      };
    }

    if (!GROQ_API_KEY) {
      return {
        success: false,
        error: 'Groq API key not configured'
      };
    }

    console.log('\n📤 Analyzing with Groq LLM...');

    // Build conversation context
    const systemPrompt = `You are a professional theme generator. Analyze requests and respond with pure JSON (no markdown).
Respond with ONLY this JSON structure - no other text:
{
  "home_comps": ["component", "names"],
  "about_comps": ["component", "names"],
  "contact_comps": ["component", "names"],
  "signup_comps": ["component", "names"],
  "login_comps": ["component", "names"],
  "privacy_comps": ["component", "names"],
  "terms_comps": ["component", "names"],
  "shop_layout": 1-5,
  "category_layout": 1-5,
  "product_layout": 1-5,
  "cart_layout": 1-5,
  "checkout_layout": 1-5,
  "style": "modern/minimal/bold/professional",
  "colors": "color description",
  "intent": "brief intent"
}`;

    const prompt = `${systemPrompt}\n\nUser plan: ${selectedPlan}\nRequest: ${userMessage}`;

    const groqResponse = await callGroqAPI(prompt);
    console.log('Groq response:', groqResponse);

    // Parse Groq response
    let analysis = {};
    try {
      analysis = JSON.parse(groqResponse);
    } catch (e) {
      // If JSON parsing fails, use defaults
      console.warn('Could not parse Groq JSON, using defaults');
      analysis = {
        home_comps: DEFAULT_COMPONENTS.home,
        about_comps: DEFAULT_COMPONENTS.about,
        contact_comps: DEFAULT_COMPONENTS.contact,
        signup_comps: DEFAULT_COMPONENTS.signup,
        login_comps: DEFAULT_COMPONENTS.login,
        privacy_comps: DEFAULT_COMPONENTS.privacy,
        terms_comps: DEFAULT_COMPONENTS.terms,
        style: 'modern',
        colors: 'default',
        intent: userMessage.substring(0, 100)
      };
    }

    // Generate page JSONs by loading from data folder
    const pages = {};
    let totalComponents = 0;

    for (const pageName of COMPONENT_PAGES) {
      console.log(`Loading ${pageName}...`);
      const components = await loadPageComponents(pageName);
      totalComponents += components.length;
      
      pages[pageName] = {
        page_name: pageName,
        page_title: pageName.charAt(0).toUpperCase() + pageName.slice(1),
        components: components,
        generated_at: new Date().toISOString()
      };
    }

    // Generate layout assignments
    const layouts = {};
    const layoutAnalysis = {
      shop_layout: analysis.shop_layout || 1,
      category_layout: analysis.category_layout || 1,
      product_layout: analysis.product_layout || 2,
      cart_layout: analysis.cart_layout || 1,
      checkout_layout: analysis.checkout_layout || 2
    };

    for (const pageName of LAYOUT_PAGES) {
      layouts[pageName] = getLayoutForPage(pageName, layoutAnalysis);
    }

    // Build complete theme
    const theme = {
      title: 'Generated Theme',
      plan: selectedPlan,
      user_message: userMessage,
      user_intent: analysis.intent || 'Custom theme',
      theme_style: analysis.style || 'modern',
      color_scheme: analysis.colors || 'default',
      generated_at: new Date().toISOString(),
      conversation_id: Date.now().toString(),
      component_pages: pages,
      layout_pages: layouts,
      summary: {
        total_component_pages: COMPONENT_PAGES.length,
        total_layout_pages: LAYOUT_PAGES.length,
        total_components: totalComponents,
        total_layouts: LAYOUT_PAGES.length,
        free_layouts: Object.values(layouts).filter(l => l.plan === 'free').length,
        pro_layouts: Object.values(layouts).filter(l => l.plan === 'pro').length
      }
    };

    console.log(`\n✓ Theme generated!`);
    console.log(`  Pages: ${COMPONENT_PAGES.length}`);
    console.log(`  Total Components: ${totalComponents}`);

    return {
      success: true,
      data: theme,
      conversation_id: theme.conversation_id
    };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { generateThemeWithGroq };
