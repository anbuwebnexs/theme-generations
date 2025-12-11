// Groq REST API Service - Theme Generator with Fixed Component Data
const https = require('https');
const fs = require('fs');
const path = require('path');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama-3.1-8b-instant';
const COMPONENT_PAGES = ['home', 'about', 'contact', 'signup', 'login', 'privacy', 'terms'];
const LAYOUT_PAGES = ['shop', 'category', 'product', 'cart', 'checkout'];

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

// Call Groq API to analyze user intent and recommend components
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

// Analyze user message and recommend which components to use
async function analyzeUserRequest(userMessage, plan) {
  const systemPrompt = `You are an expert theme designer. Analyze the user request and recommend which components from the available data should be used.
Respond with ONLY this JSON (no markdown, no extra text):
{
  "selected_component_indices": [0, 1, 2],
  "shop_layout": 1,
  "category_layout": 1,
  "product_layout": 2,
  "cart_layout": 1,
  "checkout_layout": 2,
  "theme_style": "modern",
  "colors": "default",
  "intent": "one line summary"
}
Choose component indices based on the user's request. Use available components from the ${plan} plan.`;
  
  const userPrompt = `Plan: ${plan}\nUser request: ${userMessage}`;
  
  try {
    const response = await callGroqAPI(systemPrompt, userPrompt);
    console.log('Groq analysis response:', response);
    return JSON.parse(response);
  } catch (error) {
    console.error('Analysis error:', error.message);
    // Return default recommendation
    return {
      selected_component_indices: [0, 1, 2, 3, 4],
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

// Main function to generate theme based on user request
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
    
    // Analyze user request to determine which components to use
    const analysis = await analyzeUserRequest(userMessage, selectedPlan);
    
    // Step 2: Build selected components with all properties from JSON data
    const selectedComponents = [];
    const selectedIndices = analysis.selected_component_indices || [];
    
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
    
    console.log(`✓ Selected ${selectedComponents.length} components`);
    
    // Step 3: Distribute selected components across pages
    const pages = {};
    const componentsPerPage = Math.ceil(selectedComponents.length / COMPONENT_PAGES.length);
    let componentIndex = 0;
    
    for (const pageName of COMPONENT_PAGES) {
      const pageComponents = [];
      for (let i = 0; i < componentsPerPage && componentIndex < selectedComponents.length; i++) {
        pageComponents.push(selectedComponents[componentIndex++]);
      }
      
      pages[pageName] = {
        page_name: pageName,
        page_title: pageName.charAt(0).toUpperCase() + pageName.slice(1),
        components: pageComponents.length > 0 ? pageComponents : [selectedComponents[0]],
        generated_at: new Date().toISOString()
      };
      
      console.log(`🎨 ${pageName}: ${pages[pageName].components.length} components`);
    }
    
    // Step 4: Generate layouts
    const layouts = {};
    for (const pageName of LAYOUT_PAGES) {
      const layoutNum = analysis[`${pageName}_layout`] || 1;
      layouts[pageName] = generateLayout(pageName, layoutNum);
      console.log(`📐 ${pageName}: Layout #${layoutNum}`);
    }
    
    // Step 5: Build complete theme
    const theme = {
      title: `${componentData.title} Theme`,
      plan: selectedPlan,
      user_message: userMessage,
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
        pro_layouts: Object.values(layouts).filter(l => l.plan === 'pro').length
      }
    };
    
    console.log(`\n✓ Theme ready with ${selectedComponents.length} components`);
    
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
