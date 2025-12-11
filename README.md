# Theme Generations - AI-Powered E-Commerce Theme Generator

## Overview

**Theme Generations** is an intelligent, conversational theme generator for e-commerce platforms. Powered by Groq's high-speed LLM API and built with Express.js + EJS, it dynamically generates complete theme layouts and components for 12 key e-commerce pages.

### Key Features

✅ **Conversational AI Chat** - Natural language interface to describe theme preferences  
✅ **12 Supported Pages** - Home, About, Contact, Shop, Category, Product, Cart, Checkout, Sign Up, Login, Privacy, Terms  
✅ **Free & Paid Plans** - 2 free layouts + 3 paid layouts per page  
✅ **Dynamic JSON Generation** - Groq API generates complete theme specifications  
✅ **Real-time Layout Cards** - Visual display with free/paid badges and default indicators  
✅ **Smart Defaults** - First layout automatically set as default for layout pages  
✅ **Responsive Design** - Bootstrap 5 UI for all devices  

---

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS Templates, Bootstrap 5, Vanilla JavaScript
- **AI**: Groq API (mixtral-8x7b-32768)
- **Configuration**: dotenv

---

## Project Structure

```
theme-generations/
├── app.js                      # Main Express application
├── package.json                # Dependencies
├── .env.example               # Environment variables template
├── routes/
│   ├── themeRoutes.js        # Theme generation API routes
│   └── indexRoutes.js        # Home & display routes
├── services/
│   └── groqService.js        # Groq API integration
├── views/
│   └── index.ejs             # Main chat & layout display interface
└── public/
    ├── css/
    │   └── style.css         # Custom styles
    └── js/
        └── app.js            # Client-side JavaScript
```

---

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/anbuwebnexs/theme-generations.git
cd theme-generations
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and add your Groq API key:
```env
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
NODE_ENV=development
DEFAULT_PLAN=free
```

Get your free Groq API key from: [https://console.groq.com](https://console.groq.com)

### 4. Start Server
```bash
# Development with nodemon
npm run dev

# Production
npm start
```

Access at: `http://localhost:3000`

---

## How It Works

### 1. User Sends Chat Message
Describe desired theme: *"I want a minimal dark theme with 2-column product layouts and modern typography."*

### 2. Plan Selection
Choose between **Free** (2 layouts/page) or **Paid** (5 layouts/page)

### 3. Groq Processes Request
- Groq API receives user message + selected plan
- Returns complete JSON for all 12 pages
- Each page includes layouts with components/meta and plan info

### 4. Display Generates Layout Cards
- Cards show layout names, plan badges (Free/Paid), and default indicator
- Responsive grid layout with hover effects
- Chat history displayed in left sidebar

---

## API Endpoints

### POST /api/theme/generate
Generate theme based on user request.

**Request Body:**
```json
{
  "message": "minimal dark theme with card-based product layout",
  "plan": "free"
}
```

**Response:**
```json
{
  "success": true,
  "theme": {
    "plan": "free",
    "pages": {
      "home": {
        "type": "components",
        "layouts": [...],
        "defaultLayoutId": "home_layout_1"
      },
      ...
    }
  }
}
```

### GET /
Displays main theme generator interface with chat and layout cards.

---

## Page Types & Layouts

### Component Pages (7 pages)
- **Pages**: Home, About, Contact, Sign Up, Login, Privacy, Terms & Conditions
- **Contains**: Reusable UI components (hero, forms, cards, etc.)
- **Structure**: `{ type: "components", layouts: [...], defaultLayoutId }`

### Layout Pages (5 pages)
- **Pages**: Shop, Category, Product, Cart, Checkout
- **Contains**: Full page layouts (grid, list, hero + grid, etc.)
- **Structure**: `{ type: "layouts", layouts: [...], defaultLayoutId }`
- **Meta**: Stores layout configuration (columns, sidebar, filters)

---

## Free vs Paid Plans

### Free Plan (2 layouts/page)
✓ Basic component layouts  
✓ Standard product grids  
✓ Essential pages included  
✓ No component customization  

### Paid Plan (5 layouts/page)
✓ All Free features  
✓ Advanced layouts (masonry, split, etc.)  
✓ Custom component options  
✓ Pro design variations  
✓ Priority generation  

---

## Sample Chat Prompts

```
"Create a minimal, black & white theme with flat design"

"I need a colorful grocery store theme with category focus"

"Build a luxury e-commerce theme with premium typography"

"Make a mobile-first responsive theme with sidebar navigation"

"Generate a SaaS landing page theme with hero sections"
```

---

## Development Notes

### Adding New Pages
1. Add page definition to Groq system prompt in `services/groqService.js`
2. Update route handlers in `routes/indexRoutes.js`
3. Extend EJS template in `views/index.ejs`

### Customizing Groq Prompt
Edit system prompt in `services/groqService.js` to:
- Change JSON structure
- Add new component types
- Modify layout specifications
- Adjust response format

### Styling
Customize theme with:
- `public/css/style.css` - Global styles
- Bootstrap utilities via EJS class names
- Inline styles in EJS templates

---

## Error Handling

- **Invalid Groq Response**: Returns error message in chat
- **Missing Plan/Message**: Returns 400 validation error
- **API Rate Limit**: Implement retry logic (future enhancement)

---

## Future Enhancements

- 📊 Theme persistence (save/load generated themes)
- 🎨 Live preview of selected layouts
- 🔄 Theme customization editor post-generation
- 📱 Mobile-specific layout options
- 🗂️ Theme library and marketplace
- 🌐 Multi-language support
- 📈 Analytics on popular themes

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## License

MIT License - see LICENSE file for details

---

## Support

- **Issues**: [GitHub Issues](https://github.com/anbuwebnexs/theme-generations/issues)
- **Groq Docs**: [console.groq.com](https://console.groq.com/docs)
- **Express Docs**: [expressjs.com](https://expressjs.com)

---

**Built with ❤️ by Anbu WebNexs**
