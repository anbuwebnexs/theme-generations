// Groq REST API Service - Theme Generator with JSON component/layout generation
const https = require('https');
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama-3.1-8b-instant';

// Component library from free and pro plans
const FREE_COMPONENTS = require('../data/free-1.json');
const PRO_COMPONENTS = require('../data/pro-1.json');

// Theme pages configuration
const PAGES = {
  // Component-based pages (7)
  home: { type: 'components', title: 'Home' },
  about: { type: 'components', title: 'About' },
  contact: { type: 'components', title: 'Contact' },
  signup: { type: 'components', title: 'Sign Up' },
  login: { type: 'components', title: 'Login' },
  privacy: { type: 'components', title: 'Privacy' },
  terms: { type: 'components', title: 'Terms and Conditions' },
  // Layout-based pages (5)
  shop: { type: 'layouts', title: 'Shop' },
  category: { type: 'layouts', title: 'Category' },
  product: { type: 'layouts', title: 'Product' },
  cart: { type: 'layouts', title: 'Cart' },
  checkout: { type: 'layouts', title: 'Checkout' }
};

// Convert camelCase to snake_case
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Map component objects to correct format
function formatComponent(component, plan) {
  return {
    type: component.type || 'unknown',
    title: component.title || component.type,
    visibility: component.visibility || 'visible',
    plans: typeof component.plans === 'string' ? component.plans : (component.plans && component.plans.join(',') || '1'),
    category: component.category || '1',
    ejs_file: component.ejs_file || component.ejsfile || component.type,
    css_file: component.css_file || component.cssfile || component.type,
    js_file: component.js_file || component.jsfile || component.type,
    description: component.description || '1',
    keyword: component.keyword || component.type,
    preview_image: component.preview_image || component.previewimage || '1',
    data: Array.isArray(component.data) ? component.data : (component.data ? [component.data] : [])
  };
}

// Generate component JSON for a page based on plan
function generateComponentsForPage(pageName, plan) {
  const pageComponents = {
    home: {
      free: ['heroimageslider', 'productslider', 'categoryslider', 'promobanner', 'newsletter'],
      pro: ['heroimageslider', 'productslider', 'productslider1', 'categoryslider', 'promobanner', 'shopbybrands', 'slidertabs', 'newsletter', 'productlisttabs', 'slidertabstworows', 'productslidertworows']
    },
    about: {
      free: ['heroimageslider', 'imagetextcolumn', 'categoryslider', 'testimonials'],
      pro: ['heroimageslider', 'imagetextcolumn', 'imagegridwithcategory', 'imagegridsinglecta', 'imagegridseparatecta', 'imagegridcommoncta', 'testimonials']
    },
    contact: {
      free: ['heroimageslider', 'contactform', 'newsletter'],
      pro: ['heroimageslider', 'contactform', 'promobanner', 'imagegridwithcategory', 'newsletter']
    },
    signup: {
      free: ['heroimageslider', 'signupform'],
      pro: ['heroimageslider', 'signupform', 'productslider', 'testimonials']
    },
    login: {
      free: ['heroimageslider', 'loginform'],
      pro: ['heroimageslider', 'loginform', 'productslider']
    },
    privacy: {
      free: ['heroimageslider', 'textcontent'],
      pro: ['heroimageslider', 'textcontent', 'faqaccordion']
    },
    terms: {
      free: ['heroimageslider', 'textcontent'],
      pro: ['heroimageslider', 'textcontent', 'faqaccordion']
    }
  };

  const componentsList = pageComponents[pageName]?.[plan === 'free' ? 'free' : 'pro'] || [];
  const componentData = FREE_COMPONENTS?.components || [];
  const proComponentData = PRO_COMPONENTS?.components || [];

  return componentsList.map((compType, idx) => {
    const comp = componentData.find(c => c.type === compType) || proComponentData.find(c => c.type === compType) || {};
    return formatComponent(comp, plan);
  });
}

// Generate layout JSON for a layout page
function generateLayoutsForPage(pageName, plan) {
  const layouts = [];
  const layoutCount = 5; // 5 layouts per page (2 free, 3 pro)
  
  for (let i = 1; i <= layoutCount; i++) {
    const isPlan = (plan === 'free' && i <= 2) || (plan === 'pro');
    if (!isPlan && i > 2) continue; // Skip pro layouts for free plan

    layouts.push({
      type: `${pageName}_layout_${i}`,
      title: `${PAGES[pageName].title} Layout ${i}`,
      visibility: 'visible',
      plans: (i <= 2) ? '1' : '2', // 1 = free, 2 = pro
      category: '1',
      ejs_file: `${pageName}_layout_${i}/template`,
      css_file: `${pageName}_layout_${i}/styles`,
      js_file: `${pageName}_layout_${i}/script`,
      description: `${PAGES[pageName].title} layout variant ${i}`,
      keyword: `${pageName}, layout, template`,
      preview_image: `https://imagedelivery.net/placeholder-${pageName}-layout-${i}.jpg`,
      data: []
    });
  }

  return layouts;
}

// Build complete theme JSON for all pages
function buildThemeJSON(userMessage, selectedPlan) {
  const theme = {
    components: [],
    layouts: []
  };

  // Generate component-based pages (7 pages)
  const componentPages = ['home', 'about', 'contact', 'signup', 'login', 'privacy', 'terms'];
  componentPages.forEach(pageName => {
    const pageComponents = generateComponentsForPage(pageName, selectedPlan);
    theme.components.push(...pageComponents);
  });

  // Generate layout-based pages (5 pages)
  const layoutPages = ['shop', 'category', 'product', 'cart', 'checkout'];
  layoutPages.forEach(pageName => {
    const pageLayouts = generateLayoutsForPage(pageName, selectedPlan);
    theme.layouts.push(...pageLayouts);
  });

  return {
    title: 'Generated Theme',
    plan: selectedPlan,
    user_message: userMessage,
    generated_at: new Date().toISOString(),
    components: theme.components,
    layouts: theme.layouts,
    summary: {
      total_components: theme.components.length,
      total_layouts: theme.layouts.length,
      component_pages: componentPages.length,
      layout_pages: layoutPages.length
    }
  };
}

// Main function: Generate theme with Groq API
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

    console.log('📤 Generating theme for chat message...');
    console.log(` Plan: ${selectedPlan}`);
    console.log(` Message: ${userMessage.substring(0, 60)}...`);

    // Generate theme JSON
    const themeData = buildThemeJSON(userMessage, selectedPlan);

    console.log('✓ Theme generated successfully');
    console.log(` Components: ${themeData.summary.total_components}`);
    console.log(` Layouts: ${themeData.summary.total_layouts}`);

    return {
      success: true,
      data: themeData
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
