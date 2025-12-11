// Groq REST API Service - Theme Generator with Smart Component Selection
const https = require('https');
const fs = require('fs');
const path = require('path');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama-3.1-8b-instant';
const COMPONENT_PAGES = ['home', 'about', 'contact', 'signup', 'login', 'privacy', 'terms'];
const LAYOUT_PAGES = ['shop', 'category', 'product', 'cart', 'checkout'];

// Theme intent mapping - which components are best for different theme types
const THEME_COMPONENT_MAP = {
  amazon: [0, 1, 2, 3, 4, 5, 6, 7],  // Hero, product sliders, category, promo, brands, etc.
  shopify: [0, 1, 4, 5, 6, 7],         // Hero, product sliders, promo, brands
  fashion: [0, 1, 3, 4, 8],            // Hero, products, promo, newsletter, testimonials
  grocery: [0, 1, 2, 3, 4, 5],         // Hero, products, categories, promo, brands, newsletter
  electronics: [0, 1, 2, 4, 7],        // Hero, products, categories, promo, brands
  minimal: [0, 1, 6],                  // Simple: hero, products, newsletter
  modern: [0, 1, 2, 3, 4, 5],          // Hero, products, categories, promo, brands, newsletter
  classic: [0, 1, 3, 5],               // Hero, products, promo, brands
};

if (!GROQ_API_KEY) {
  console.warn('⚠️ GROQ_API_KEY not set');
}

// Load component data from JSON files
function loadComponentData(plan) {
  try {
    const filename = plan === 'paid' || plan === 'pro' ? 'pro-1.json' : 'free-1.json';
    const filePath = path.join(__dirname, '../data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading component data:', error.message);
    return { title: 'Default', components: [] };
  }
}

// Call Groq API to analyze user intent
async function callGroqAPI(systemPrompt, userMessage) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
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
          reject(new Error(`Groq parse error: ${e.message}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Analyze user message and detect theme intent
async function analyzeThemeIntent(userMessage, plan, availableComponentCount) {
  const systemPrompt = `You are an expert e-commerce theme designer. Analyze the user request and identify the theme type and recommended components.

Respond with ONLY this JSON (no markdown, no extra text):
{
  "theme_type": "amazon|shopify|fashion|grocery|electronics|minimal|modern|classic",
  "component_indices": [0, 1, 2, 3, 4],
  "shop_layout": 1-5,
  "category_layout": 1-5,
  "product_layout": 1-5,
  "cart_layout": 1-5,
  "checkout_layout": 1-5,
  "theme_style": "modern|classic|minimal|vibrant",
  "colors": "color description",
  "intent": "one line summary"
}

For theme type, match the closest type. Available component indices: 0-${availableComponentCount - 1}.
Make sure component_indices are within available range.
For amazon clone, use more components. For minimal, use fewer. Include hero slider (usually 0) in almost all themes.`;
  
  const userPrompt = `Plan: ${plan}\nUser request: ${userMessage}`;
  
  try {
    const response = await callGroqAPI(systemPrompt, userPrompt);
    console.log('Groq analysis response:', response);
    return JSON.parse(response);
  } catch (error) {
    console.error('Analysis error:', error.message);
    // Default to modern theme with multiple components
    return {
      theme_type: 'modern',
      component_indices: [0, 1, 2, 3, 4].filter(i => i < availableComponentCount),
      shop_layout: 1,
      category_layout: 1,
      product_layout: 2,
      cart_layout: 1,
      checkout_layout: 2,
      theme_style: 'modern',
      colors: 'default',
      intent: userMessage.substring(0, 100)
    };
  }
}

// Generate layout info
function generateLayout(pageName, layoutNum) {
  const isPro = layoutNum > 2;
  const layouts = {
    shop: ['Grid', 'List', 'Masonry', 'Hero+Grid', 'Sidebar+Main'],
    category: ['Grid', 'List', 'Masonry', 'Hero+Grid', 'Sidebar+Main'],
    product: ['Slider', 'List', 'Detailed', 'Comparison', 'Featured'],
    cart: ['Simple', 'Detailed', 'Mini', 'Fullpage', 'Preview'],
    checkout: ['Steps', 'Single', 'Multi', 'Express', 'Full']
  };
  
  return {
    page_name: pageName,
    page_title: pageName.charAt(0).toUpperCase() + pageName.slice(1),
    layout_number: layoutNum,
    layout_name: (layouts[pageName] && layouts[pageName][layoutNum - 1]) || `Layout ${layoutNum}`,
    plan: isPro ? 'pro' : 'free',
    ejs_file: `${pageName}/layout_${layoutNum}`,
    css_file: `${pageName}/layout_${layoutNum}`,
    js_file: `${pageName}/layout_${layoutNum}`,
    description: `${pageName} with ${isPro ? 'Pro' : 'Free'} layout`
  };
}

// Build page with multiple selected components
function buildPageWithComponents(pageName, allSelectedComponents) {
  // Assign components to pages smartly
  const componentsForPage = [];
  
  // Home page gets most components
  if (pageName === 'home') {
    componentsForPage.push(...allSelectedComponents.slice(0, Math.ceil(allSelectedComponents.length * 0.5)));
  }
  // About page gets some display components
  else if (pageName === 'about') {
    componentsForPage.push(...allSelectedComponents.filter(c => 
      c.category === '1' || c.category === 'display'
    ));
  }
  // Contact page gets contact related
  else if (pageName === 'contact') {
    componentsForPage.push(...allSelectedComponents.filter(c => 
      c.type.includes('contact') || c.type.includes('form')
    ));
  }
  // Other pages get remaining components
  else {
    const used = componentsForPage.length;
    componentsForPage.push(allSelectedComponents[used % allSelectedComponents.length]);
  }
  
  return {
    page_name: pageName,
    page_title: pageName.charAt(0).toUpperCase() + pageName.slice(1),
    components: componentsForPage.length > 0 ? componentsForPage : [allSelectedComponents[0]],
    generated_at: new Date().toISOString()
  };
}

// Main function to generate theme
async function generateThemeWithGroq(userMessage, selectedPlan) {
  try {
    if (!userMessage || !selectedPlan) {
      return { success: false, error: 'Message and plan required' };
    }
    
    if (!GROQ_API_KEY) {
      return { success: false, error: 'GROQ_API_KEY not configured' };
    }
    
    console.log('\n📤 Analyzing user request...');
    
    // Load component data from JSON
    const componentData = loadComponentData(selectedPlan);
    console.log(`📦 Loaded ${componentData.components.length} components for ${selectedPlan} plan`);
    
    // Analyze user intent and get recommended components
    const analysis = await analyzeThemeIntent(userMessage, selectedPlan, componentData.components.length);
    
    // Get component indices from analysis
    let selectedIndices = analysis.component_indices || [];
    if (!Array.isArray(selectedIndices)) {
      selectedIndices = [0, 1, 2, 3, 4].filter(i => i < componentData.components.length);
    }
    
    // Build selected components with all properties
    const selectedComponents = [];
    selectedIndices.forEach(index => {
      if (componentData.components[index]) {
        const component = componentData.components[index];
        selectedComponents.push({
          type: component.type,
          title: component.title || 'Untitled Component',
          visibility: component.visibility || 'visible',
          plans: component.plans,
          category: component.category || 'general',
          ejs_file: component.ejs_file,
          css_file: component.css_file,
          js_file: component.js_file,
          description: component.description || 'Component',
          keyword: component.keyword || `${component.type}, component`,
          preview_image: component.preview_image || 'https://imagedelivery.net/placeholder.jpg',
          data: component.data || []
        });
      }
    });
    
    console.log(`✓ Selected ${selectedComponents.length} components for ${analysis.theme_type} theme`);
    
    // Build pages with multiple components
    const pages = {};
    for (const pageName of COMPONENT_PAGES) {
      pages[pageName] = buildPageWithComponents(pageName, selectedComponents);
      console.log(`🎨 ${pageName}: ${pages[pageName].components.length} components`);
    }
    
    // Generate layouts
    const layouts = {};
    for (const pageName of LAYOUT_PAGES) {
      const layoutNum = analysis[`${pageName}_layout`] || 1;
      layouts[pageName] = generateLayout(pageName, layoutNum);
      console.log(`📐 ${pageName}: Layout #${layoutNum}`);
    }
    
    // Build complete theme
    const theme = {
      title: `${analysis.theme_type.charAt(0).toUpperCase() + analysis.theme_type.slice(1)} Theme`,
      plan: selectedPlan,
      user_message: userMessage,
      theme_type: analysis.theme_type,
      user_intent: analysis.intent || 'Custom theme',
      theme_style: analysis.theme_style || 'modern',
      color_scheme: analysis.colors || 'default',
      generated_at: new Date().toISOString(),
      conversation_id: Date.now().toString(),
      component_pages: pages,
      layout_pages: layouts,
      summary: {
        total_component_pages: COMPONENT_PAGES.length,
        total_layout_pages: LAYOUT_PAGES.length,
        total_components: selectedComponents.length,
        total_layouts: LAYOUT_PAGES.length,
        free_layouts: Object.values(layouts).filter(l => l.plan === 'free').length,
        pro_layouts: Object.values(layouts).filter(l => l.plan === 'pro').length,
        theme_type: analysis.theme_type
      }
    };
    
    console.log(`\n✓ Theme ready: ${selectedComponents.length} components across ${Object.keys(pages).length} pages`);
    
    return {
      success: true,
      data: theme
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
