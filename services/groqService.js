// Groq REST API Service - Conversational Theme Generator
const https = require('https');
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama-3.1-8b-instant';

// Component library from free and pro plans
const FREE_COMPONENTS = require('../data/free-1.json');
const PRO_COMPONENTS = require('../data/pro-1.json');

// Page definitions
const COMPONENT_PAGES = ['home', 'about', 'contact', 'signup', 'login', 'privacy', 'terms'];
const LAYOUT_PAGES = ['shop', 'category', 'product', 'cart', 'checkout'];

// Layout selection templates (1-2: free, 3-5: pro)
const LAYOUT_TEMPLATES = {
  shop: { layouts: ['grid', 'list', 'masonry', 'hero_grid', 'sidebar_main'] },
  category: { layouts: ['grid', 'list', 'masonry', 'hero_grid', 'sidebar_main'] },
  product: { layouts: ['hero_slider', 'list', 'detailed', 'comparison', 'featured'] },
  cart: { layouts: ['simple', 'detailed', 'mini', 'fullpage', 'checkout_preview'] },
  checkout: { layouts: ['steps', 'single_page', 'multi_step', 'express', 'full_flow'] }
};

if (!GROQ_API_KEY) {
  console.warn('⚠️ Warning: GROQ_API_KEY not found in .env file');
} else {
  console.log('✓ Groq API Key loaded successfully');
}

// Call Groq LLM to generate theme based on user message
async function callGroqAPI(prompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
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
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Analyze user message with Groq to determine page components and layout preferences
async function analyzeThemeRequest(userMessage, plan) {
  const prompt = `You are a theme generator expert. Analyze this user request and respond with a JSON object containing:

User Request: "${userMessage}"
User Plan: ${plan}

Respond with ONLY a valid JSON object (no markdown, no extra text) with this structure:
{
  "home": ["component_type1", "component_type2"],
  "about": ["component_type"],
  "contact": ["component_type"],
  "signup": ["component_type"],
  "login": ["component_type"],
  "privacy": ["component_type"],
  "terms": ["component_type"],
  "shop_layout": 1-5,
  "category_layout": 1-5,
  "product_layout": 1-5,
  "cart_layout": 1-5,
  "checkout_layout": 1-5,
  "theme_style": "modern/minimal/bold/professional",
  "color_scheme": "description",
  "user_intent": "brief description"
}

Use component types from: heroimageslider, productslider, categoryslider, promobanner, newsletter, contactform, contactinfo, faqaccordion, team, testimonials, imagetextcolumn
For layouts, select numbers 1-5 where 1-2 are free and 3-5 are pro.`;

  try {
    const response = await callGroqAPI(prompt);
    console.log('Groq Analysis Response:', response);
    return JSON.parse(response);
  } catch (error) {
    console.error('Error analyzing theme request:', error);
    return null;
  }
}

// Select appropriate components from library based on analysis
function selectComponentsForPage(pageName, componentTypes, plan, allComponents) {
  const components = [];
  const freeComps = FREE_COMPONENTS?.components || [];
  const proComps = PRO_COMPONENTS?.components || [];
  const availableComps = plan === 'free' ? freeComps : [...freeComps, ...proComps];

  componentTypes.forEach(compType => {
    const found = availableComps.find(c => 
      c.type === compType || 
      c.title.toLowerCase().includes(compType.toLowerCase())
    );

    if (found) {
      components.push({
        type: found.type || compType,
        title: found.title || compType,
        visibility: 'visible',
        plans: found.plans || (plan === 'free' ? '1' : '1,2'),
        category: found.category || '1',
        ejs_file: found.ejs_file || found.ejsfile || compType,
        css_file: found.css_file || found.cssfile || compType,
        js_file: found.js_file || found.jsfile || compType,
        description: found.description || `${compType} component for ${pageName}`,
        keyword: found.keyword || `${pageName}, ${compType}`,
        preview_image: found.preview_image || found.previewimage || '1',
        data: found.data || []
      });
    }
  });

  return components;
}

// Generate individual page JSON
function generatePageJSON(pageName, components) {
  return {
    page_name: pageName,
    page_title: pageName.charAt(0).toUpperCase() + pageName.slice(1),
    components: components,
    generated_at: new Date().toISOString()
  };
}

// Generate layout assignment JSON
function generateLayoutAssignments(layoutAnalysis) {
  const layouts = {};
  
  LAYOUT_PAGES.forEach(pageName => {
    const layoutNum = layoutAnalysis[`${pageName}_layout`] || 1;
    const isPro = layoutNum > 2;
    
    layouts[pageName] = {
      page_name: pageName,
      page_title: pageName.charAt(0).toUpperCase() + pageName.slice(1),
      layout_number: layoutNum,
      layout_name: LAYOUT_TEMPLATES[pageName]?.layouts[layoutNum - 1] || `Layout ${layoutNum}`,
      plan: isPro ? 'pro' : 'free',
      ejs_file: `${pageName}/layout_${layoutNum}`,
      css_file: `${pageName}/layout_${layoutNum}`,
      js_file: `${pageName}/layout_${layoutNum}`,
      description: `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} page with ${isPro ? 'Pro' : 'Free'} layout #${layoutNum}`,
      preview_image: `https://imagedelivery.net/placeholder-${pageName}-layout-${layoutNum}.jpg`
    };
  });

  return layouts;
}

// Main function: Generate theme conversationally with Groq
async function generateThemeWithGroq(userMessage, selectedPlan) {
  try {
    // Validate inputs
    if (!userMessage || !selectedPlan) {
      return {
        success: false,
        error: 'Message and plan are required'
      };
    }

    if (!GROQ_API_KEY) {
      return {
        success: false,
        error: 'Groq API key not configured. Please set GROQ_API_KEY in .env file.'
      };
    }

    console.log('\n📤 Analyzing theme request with Groq LLM...');
    console.log(` Plan: ${selectedPlan}`);
    console.log(` Message: ${userMessage.substring(0, 80)}...\n`);

    // Use Groq to analyze user request
    const analysis = await analyzeThemeRequest(userMessage, selectedPlan);

    if (!analysis) {
      return {
        success: false,
        error: 'Failed to analyze theme request with Groq LLM'
      };
    }

    // Generate page JSONs based on Groq analysis
    const pages = {};
    let totalComponents = 0;

    for (const pageName of COMPONENT_PAGES) {
      const componentTypes = analysis[pageName] || [];
      console.log(`\n🎨 Generating ${pageName.toUpperCase()} page`);
      console.log(`   Components: ${componentTypes.join(', ')}`);

      const selectedComponents = selectComponentsForPage(
        pageName,
        componentTypes,
        selectedPlan,
        { FREE_COMPONENTS, PRO_COMPONENTS }
      );

      totalComponents += selectedComponents.length;
      pages[pageName] = generatePageJSON(pageName, selectedComponents);
    }

    // Generate layout assignments
    console.log(`\n📐 Generating Layout Assignments`);
    const layouts = generateLayoutAssignments(analysis);
    let layoutStr = '';
    LAYOUT_PAGES.forEach(page => {
      layoutStr += `\n   ${page}: Layout #${layouts[page].layout_number} (${layouts[page].plan.toUpperCase()})`;
    });
    console.log(layoutStr);

    // Compile complete theme
    const theme = {
      title: 'Generated Theme',
      plan: selectedPlan,
      user_message: userMessage,
      user_intent: analysis.user_intent || 'Custom theme',
      theme_style: analysis.theme_style || 'modern',
      color_scheme: analysis.color_scheme || 'default',
      generated_at: new Date().toISOString(),
      component_pages: pages,
      layout_pages: layouts,
      summary: {
        total_component_pages: COMPONENT_PAGES.length,
        total_layout_pages: LAYOUT_PAGES.length,
        total_components: totalComponents,
        total_layouts: LAYOUT_PAGES.length,
        free_layouts: LAYOUT_PAGES.filter(p => layouts[p].plan === 'free').length,
        pro_layouts: LAYOUT_PAGES.filter(p => layouts[p].plan === 'pro').length
      }
    };

    console.log(`\n✓ Theme generated successfully!`);
    console.log(`  Component Pages: ${COMPONENT_PAGES.length}`);
    console.log(`  Total Components: ${totalComponents}`);
    console.log(`  Layout Pages: ${LAYOUT_PAGES.length}`);

    return {
      success: true,
      data: theme
    };
  } catch (error) {
    console.error('❌ Theme Generation Error:', error.message);

    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { generateThemeWithGroq };
