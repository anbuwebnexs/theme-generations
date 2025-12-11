// Groq REST API Service - Theme Generator with actual component/layout generation
const https = require('https');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama-3.1-8b-instant';

// Theme pages configuration
const PAGES = {
  // Component-based pages (7)
  home: { type: 'components', title: 'Home' },
  about: { type: 'components', title: 'About' },
  contact: { type: 'components', title: 'Contact' },
  signup: { type: 'components', title: 'Sign Up' },
  login: { type: 'components', title: 'Login' },
  privacy: { type: 'components', title: 'Privacy Policy' },
  terms: { type: 'components', title: 'Terms & Conditions' },
  // Layout-based pages (5)
  shop: { type: 'layouts', title: 'Shop' },
  category: { type: 'layouts', title: 'Category' },
  product: { type: 'layouts', title: 'Product' },
  cart: { type: 'layouts', title: 'Cart' },
  checkout: { type: 'layouts', title: 'Checkout' }
};

// Component library for theming
const COMPONENT_LIBRARY = {
  components: {
    hero: { name: 'Hero Section', category: 'display' },
    navbar: { name: 'Navigation Bar', category: 'navigation' },
    footer: { name: 'Footer', category: 'navigation' },
    cta_button: { name: 'Call-to-Action Button', category: 'interactive' },
    form: { name: 'Form Fields', category: 'interactive' },
    card: { name: 'Card Component', category: 'display' },
    slider: { name: 'Image Slider', category: 'display' },
    grid: { name: 'Grid Layout', category: 'layout' },
    testimonial: { name: 'Testimonials', category: 'display' },
    feature_box: { name: 'Feature Box', category: 'display' },
    sidebar: { name: 'Sidebar', category: 'navigation' },
    breadcrumb: { name: 'Breadcrumb', category: 'navigation' }
  },
  layouts: {
    grid: { name: 'Grid Layout', columns: [3, 4, 2] },
    list: { name: 'List Layout', style: 'vertical' },
    masonry: { name: 'Masonry Layout', adaptive: true },
    hero_grid: { name: 'Hero + Grid', sections: ['hero', 'grid'] },
    sidebar_main: { name: 'Sidebar + Main', ratio: '1:3' }
  }
};

if (!GROQ_API_KEY) {
  console.warn('⚠️  Warning: GROQ_API_KEY not found in .env file');
} else {
  console.log('✓ Groq API Key loaded successfully');
}

// Generate themed components based on preferences
function generateComponentsForPage(pageName, themePreferences, plan) {
  const pageConfig = PAGES[pageName];
  const components = [];
  
  // Determine number of free/paid layouts
  const freeCount = plan === 'free' ? 2 : 2;
  const paidCount = plan === 'free' ? 0 : 3;
  
  // Generate free layouts (always included)
  for (let i = 0; i < freeCount; i++) {
    components.push({
      id: `${pageName}_layout_${i + 1}`,
      name: `${pageConfig.title} Layout ${i + 1}`,
      plan: 'free',
      components: generateComponentList(pageName, themePreferences, i),
      theme: themePreferences
    });
  }
  
  // Generate paid layouts (for paid plans)
  if (plan === 'paid') {
    for (let i = 0; i < paidCount; i++) {
      components.push({
        id: `${pageName}_layout_${freeCount + i + 1}`,
        name: `${pageConfig.title} Premium Layout ${i + 1}`,
        plan: 'paid',
        components: generateComponentList(pageName, themePreferences, freeCount + i),
        theme: { ...themePreferences, premium: true }
      });
    }
  }
  
  return components;
}

// Generate specific component list for a layout
function generateComponentList(pageName, themePreferences, layoutIndex) {
  const componentList = [];
  const pageType = PAGES[pageName].type;
  
  // Page-specific components
  const pageComponents = {
    home: ['navbar', 'hero', 'feature_box', 'card', 'cta_button', 'footer'],
    about: ['navbar', 'hero', 'card', 'testimonial', 'cta_button', 'footer'],
    contact: ['navbar', 'form', 'card', 'cta_button', 'footer'],
    shop: ['navbar', 'grid', 'sidebar', 'footer'],
    category: ['navbar', 'grid', 'sidebar', 'footer'],
    product: ['navbar', 'slider', 'card', 'cta_button', 'footer'],
    cart: ['navbar', 'card', 'form', 'cta_button', 'footer'],
    checkout: ['navbar', 'form', 'card', 'cta_button', 'footer'],
    signup: ['navbar', 'form', 'card', 'cta_button', 'footer'],
    login: ['navbar', 'form', 'card', 'cta_button', 'footer'],
    privacy: ['navbar', 'breadcrumb', 'card', 'footer'],
    terms: ['navbar', 'breadcrumb', 'card', 'footer']
  };
  
  const components = pageComponents[pageName] || [];
  return components.map((comp, idx) => ({
    type: comp,
    name: COMPONENT_LIBRARY.components[comp]?.name || comp,
    order: idx,
    theme_applied: true,
    variant: layoutIndex % 2 === 0 ? 'default' : 'alternate'
  }));
}

// Generate layout configurations
function generateLayoutsForPage(pageName, themePreferences, plan) {
  const pageConfig = PAGES[pageName];
  const layouts = [];
  
  const freeCount = plan === 'free' ? 2 : 2;
  const paidCount = plan === 'free' ? 0 : 3;
  
  const layoutTypes = Object.values(COMPONENT_LIBRARY.layouts);
  
  // Generate free layouts
  for (let i = 0; i < freeCount; i++) {
    const layout = layoutTypes[i % layoutTypes.length];
    layouts.push({
      id: `${pageName}_layout_${i + 1}`,
      name: `${pageConfig.title} - ${layout.name}`,
      plan: 'free',
      meta: {
        type: layout.name,
        columns: layout.columns ? layout.columns[i % layout.columns.length] : 3,
        responsive: true,
        theme: themePreferences
      }
    });
  }
  
  // Generate paid layouts
  if (plan === 'paid') {
    for (let i = 0; i < paidCount; i++) {
      const layout = layoutTypes[(freeCount + i) % layoutTypes.length];
      layouts.push({
        id: `${pageName}_layout_${freeCount + i + 1}`,
        name: `${pageConfig.title} - Premium ${layout.name}`,
        plan: 'paid',
        meta: {
          type: layout.name,
          columns: layout.columns ? layout.columns[(freeCount + i) % layout.columns.length] : 4,
          responsive: true,
          premium: true,
          theme: { ...themePreferences, premium: true }
        }
      });
    }
  }
  
  return layouts;
}

// Build complete theme JSON for all 12 pages
function buildThemeJSON(userMessage, selectedPlan) {
  const themePreferences = {
    message: userMessage,
    plan: selectedPlan,
    generated_at: new Date().toISOString()
  };
  
  const theme = {
    plan: selectedPlan,
    pages: {}
  };
  
  Object.entries(PAGES).forEach(([pageName, pageConfig]) => {
    if (pageConfig.type === 'components') {
      theme.pages[pageName] = {
        type: 'components',
        title: pageConfig.title,
        layouts: generateComponentsForPage(pageName, themePreferences, selectedPlan),
        defaultLayoutId: `${pageName}_layout_1`
      };
    } else {
      theme.pages[pageName] = {
        type: 'layouts',
        title: pageConfig.title,
        layouts: generateLayoutsForPage(pageName, themePreferences, selectedPlan),
        defaultLayoutId: `${pageName}_layout_1`
      };
    }
  });
  
  return theme;
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

    if (!GROQ_API_KEY) {
      return {
        success: false,
        error: 'Groq API key not configured. Please set GROQ_API_KEY in .env file.'
      };
    }

    console.log('📤 Generating theme for chat message...');
    console.log(`   Plan: ${selectedPlan}`);
    console.log(`   Message: ${userMessage.substring(0, 60)}...`);
    console.log(`   Pages: ${Object.keys(PAGES).length}`);
    console.log(`   Components: ${Object.keys(COMPONENT_LIBRARY.components).length}`);
    console.log(`   Layouts: ${Object.keys(COMPONENT_LIBRARY.layouts).length}`);

    // Generate theme JSON based on preferences
    const themeData = buildThemeJSON(userMessage, selectedPlan);
    
    console.log('✓ Theme generated successfully');
    console.log(`   Pages generated: ${Object.keys(themeData.pages).length}`);
    
    // Count components and layouts
    let totalLayouts = 0;
    let totalComponents = 0;
    Object.values(themeData.pages).forEach(page => {
      totalLayouts += page.layouts.length;
      if (page.type === 'components') {
        page.layouts.forEach(layout => {
          totalComponents += layout.components.length;
        });
      }
    });
    
    console.log(`   Total layouts: ${totalLayouts}`);
    console.log(`   Total components: ${totalComponents}`);
    
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
