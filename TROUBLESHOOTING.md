# Theme Generations - Troubleshooting Guide

Common issues and their solutions.

---

## Error: "TypeError: Cannot read properties of undefined (reading 'create')"

### Cause
The Groq API client is not initialized. This happens when:
1. `GROQ_API_KEY` is not set in `.env` file
2. The Groq SDK package is not installed
3. `.env` file doesn't exist or is not being loaded

### Solution

#### Step 1: Verify Dependencies
```bash
npm list groq-sdk
```
If `groq-sdk` is NOT listed, install it:
```bash
npm install groq-sdk
```

#### Step 2: Check .env File
Ensure `.env` file exists in the root directory:
```bash
ls -la .env
```

If it doesn't exist, create it:
```bash
cp .env.example .env
```

#### Step 3: Add Your Groq API Key
Edit `.env` and add your API key:
```env
GROQ_API_KEY=your_actual_groq_api_key_here
PORT=3000
NODE_ENV=development
```

**Where to get API key:**
1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Go to API Keys section
4. Generate a new API key
5. Copy and paste into `.env`

#### Step 4: Restart Server
```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

#### Step 5: Test Connection
Check console logs for:
```
Theme Generator running on http://localhost:3000
```

---

## Error: "Invalid or missing GROQ_API_KEY"

### Cause
API key is invalid or expired.

### Solution
1. Generate a new API key from [console.groq.com](https://console.groq.com)
2. Update `.env` with new key
3. Restart server

---

## Error: "Rate limit exceeded"

### Cause
Too many requests to Groq API in a short time.

### Solution
1. Wait a few seconds and try again
2. Check your Groq plan limits
3. Implement request queuing (future enhancement)

---

## Error: "Module not found: 'groq-sdk'"

### Cause
Groq SDK is not installed.

### Solution
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Chat Not Responding

### Cause 1: Groq API Not Connected
**Check:**
- Server console for error messages
- `.env` file has `GROQ_API_KEY`
- API key is valid

**Fix:**
```bash
# Check server logs
npm run dev

# Look for lines like:
# "Calling Groq API with message..."
# "Groq response received..."
```

### Cause 2: Network Issues
**Check:**
- Internet connection is active
- Can access [https://api.groq.com](https://api.groq.com)

**Fix:**
```bash
# Test connectivity
curl https://api.groq.com
```

### Cause 3: Invalid Request Format
**Check:**
- Message is not empty
- Plan is selected (free/paid)

**Fix:**
Re-send message with proper plan selection.

---

## Error: "Cannot POST /api/theme/generate"

### Cause
Route not registered or server not running.

### Solution
1. Verify server is running: `npm run dev`
2. Check server port (default: 3000)
3. Verify routes are loaded in `app.js`:
   ```javascript
   app.use('/api/theme', require('./routes/themeRoutes'));
   ```

---

## Error: "Cannot find module './routes/themeRoutes'"

### Cause
Route files don't exist or incorrect path.

### Solution
Verify file structure:
```
theme-generations/
├── routes/
│   ├── themeRoutes.js      ✓ Must exist
│   └── indexRoutes.js      ✓ Must exist
├── services/
│   └── groqService.js      ✓ Must exist
├── app.js
└── package.json
```

---

## JSON Parse Error

### Cause
Groq API returned invalid JSON format.

### Solution
1. Check Groq response in console logs
2. System prompt may need adjustment
3. Increase `max_tokens` if response is truncated

**In `services/groqService.js`, line 37:**
```javascript
max_tokens: 4000,  // Increase if needed: 4000, 5000, 6000
```

---

## Port Already in Use

### Error
```
Error: listen EADDRINUSE: address already in use :::3000
```

### Solution

#### Option 1: Use Different Port
Edit `.env`:
```env
PORT=3001
```

#### Option 2: Kill Process on Port
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

---

## Theme Not Displaying

### Cause
JavaScript not loading or parse error.

### Solution
1. Check browser console for errors (F12)
2. Verify `/js/app.js` is loading
3. Check `/css/` files are accessible
4. Test in different browser

---

## CORS Errors

### Error
```
Access to XMLHttpRequest blocked by CORS policy
```

### Solution
CORS is enabled in `app.js` (line 10):
```javascript
app.use(cors());
```

If issue persists:
```bash
# Update CORS in app.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

## Need More Help?

1. **Check Logs**: Review server console output with `npm run dev`
2. **Validate Groq Key**: Test at [console.groq.com](https://console.groq.com)
3. **Check Dependencies**: Run `npm list` to verify all packages
4. **Clean Install**: 
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```
5. **GitHub Issues**: Report at [GitHub Issues](https://github.com/anbuwebnexs/theme-generations/issues)

---

## Quick Checklist

- [ ] `.env` file exists in root directory
- [ ] `GROQ_API_KEY` is set in `.env`
- [ ] API key is valid (test at console.groq.com)
- [ ] All dependencies installed (`npm install`)
- [ ] No other app using port 3000
- [ ] Server running (`npm run dev`)
- [ ] Can access `http://localhost:3000` in browser
- [ ] Browser console (F12) shows no errors
- [ ] Message and plan are filled before sending

---

**Last Updated**: 2025-12-11
