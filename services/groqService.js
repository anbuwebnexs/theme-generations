// Groq REST API Service - Conversational Theme Generator with Dynamic Component Generation
const https = require('https');
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama-3.1-8b-instant';

const COMPONENT_PAGES = ['home', 'about', 'contact', 'signup', 'login', 'privacy', 'terms'];
const LAYOUT_PAGES = ['shop', 'category', 'product', 'cart', 'checkout'];

// Component templates for dynamic generation
const COMPONENT_TEMPLATES = {
  heroimageslider: { title: 'Hero Image Slider', category: 'display', ejs: 'heroimageslider/1' },
  productslider: { title: 'Product Slider', category: 'display', ejs: 'productslider/1' },
  categoryslider: { title: 'Category Slider', category: 'display', ejs: 'categoryslider/1' },
  promobanner: { title: 'Promo Banner', category: 'display', ejs: 'promobanner/1' },
  newsletter: { title: 'Newsletter Signup', category: 'interactive', ejs: 'newsletter/1' },
  contactform: { title: 'Contact Form', category: 'interactive', ejs: 'contactform/1' },
  contactinfo: { title: 'Contact Info', category: 'display', ejs: 'contactinfo/1' },
  faqaccordion: { title: 'FAQ Accordion', category: 'interactive', ejs: 'faqaccordion/1' },
  testimonials: { title: 'Testimonials', category: 'display', ejs: 'testimonials/1' },
  team: { title: 'Team Showcase', category: 'display', ejs: 'team/1' },
  imagetextcolumn: { title: 'Image Text Column', category: 'display', ejs: 'imagetextcolumn/1' },
  signup: { title: 'Signup Form', category: 'interactive', ejs: 'signup/1' },
  loginform: { title: 'Login Form', category: 'interactive', ejs: 'loginform/1' },
  textcontent: { title: 'Text Content', category: 'display', ejs: 'textcontent/1' },
  statisticsbar: { title: 'Statistics Bar', category: 'display', ejs: 'statisticsbar/1' }
};

if (!GROQ_API_KEY) {
  console.warn('⚠️ GROQ_API_KEY not set');
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

// Analyze user message and generate page-specific components
async function analyzeAndGenerateComponents(userMessage, plan) {
  const systemPrompt = `You are an expert theme designer. Analyze the user request and generate a JSON response that lists which components each page should have.

Respond with ONLY this JSON (no markdown, no extra text):
{
  "home": ["component_names_as_array"],
  "about": ["component_names_as_array"],
  "contact": ["component_names_as_array"],
  "signup": ["component_names_as_array"],
  "login": ["component_names_as_array"],
  "privacy": ["component_names_as_array"],
  "terms": ["component_names_as_array"],
  "shop_layout": 1-5,
  "category_layout": 1-5,
  "product_layout": 1-5,
  "cart_layout": 1-5,
  "checkout_layout": 1-5,
  "theme_style": "style_name",
  "colors": "color description",
  "intent": "one line summary"
}

Available components: heroimageslider, productslider, categoryslider, promobanner, newsletter, contactform, contactinfo, faqaccordion, testimonials, team, imagetextcolumn, signup, loginform, textcontent, statisticsbar

If plan is "free", limit to simpler components. If "paid", can include all.`;

  const userPrompt = `User plan: ${plan}\nUser request: ${userMessage}`;

  try {
    const response = await callGroqAPI(systemPrompt, userPrompt);
    console.log('Groq response:', response);
    return JSON.parse(response);
  } catch (error) {
    console.error('Analysis error:', error.message);
    // Return default structure
    return {
      home: ['heroimageslider', 'productslider', 'promobanner', 'newsletter'],
      about: ['heroimageslider', 'imagetextcolumn', 'testimonials'],
      contact: ['contactform', 'contactinfo', 'faqaccordion'],
      signup: ['signup', 'newsletter'],
      login: ['loginform'],
      privacy: ['textcontent', 'faqaccordion'],
      terms: ['textcontent'],
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

// Dynamically create component object from template
function createComponent(compType, pageName) {
  const template = COMPONENT_TEMPLATES[compType] || COMPONENT_TEMPLATES.heroimageslider;
  return {
    type: compType,
    title: template.title,
    visibility: 'visible',
    plans: '1',
    category: template.category,
    ejs_file: template.ejs,
    css_file: `${compType}/1`,
    js_file: `${compType}/1`,
    description: `${template.title} component for ${pageName} page`,
    keyword: `${pageName}, ${compType}, component`,
    preview_image: `https://imagedelivery.net/placeholder-${compType}.jpg`,
    data: []
  };
}

// Generate components for a page based on analysis
function generatePageComponents(pageName, componentTypes) {
  const components = componentTypes
    .filter(ct => ct && COMPONENT_TEMPLATES[ct])
    .map(ct => createComponent(ct, pageName));
  
  return components.length > 0 ? components : [createComponent('heroimageslider', pageName)];
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

// Main: Generate theme based on conversation
async function generateThemeWithGroq(userMessage, selectedPlan) {
  try {
    if (!userMessage || !selectedPlan) {
      return { success: false, error: 'Message and plan required' };
    }

    if (!GROQ_API_KEY) {
      return { success: false, error: 'GROQ_API_KEY not configured' };
    }

    console.log('\n📤 Analyzing user request...');

    // Step 1: Analyze and get component recommendations
    const analysis = await analyzeAndGenerateComponents(userMessage, selectedPlan);

    // Step 2: Generate page components
    const pages = {};
    let totalComponents = 0;

    for (const pageName of COMPONENT_PAGES) {
      const componentTypes = analysis[pageName] || [];
      const components = generatePageComponents(pageName, componentTypes);
      totalComponents += components.length;

      pages[pageName] = {
        page_name: pageName,
        page_title: pageName.charAt(0).toUpperCase() + pageName.slice(1),
        components: components,
        generated_at: new Date().toISOString()
      };
      
      console.log(`🎨 ${pageName}: ${components.length} components`);
    }

    // Step 3: Generate layouts
    const layouts = {};
    for (const pageName of LAYOUT_PAGES) {
      const layoutNum = analysis[`${pageName}_layout`] || 1;
      layouts[pageName] = generateLayout(pageName, layoutNum);
      console.log(`📐 ${pageName}: Layout #${layoutNum}`);
    }

    // Step 4: Build complete theme
    const theme = {
      title: 'Generated Theme',
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
        total_components: totalComponents,
        total_layouts: LAYOUT_PAGES.length,
        free_layouts: Object.values(layouts).filter(l => l.plan === 'free').length,
        pro_layouts: Object.values(layouts).filter(l => l.plan === 'pro').length
      }
    };

    console.log(`\n✓ Theme ready with ${totalComponents} total components`);

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
