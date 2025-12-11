const express = require('express');
const router = express.Router();
const { generateThemeWithGroq } = require('../services/groqService');

// POST: Generate theme based on chat message
router.post('/generate', async (req, res) => {
  const { message, plan } = req.body;
  
  if (!message || !plan) {
    return res.status(400).json({ error: 'Message and plan are required' });
  }
  
  const result = await generateThemeWithGroq(message, plan);
  
  if (result.success) {
    res.json({ success: true, theme: result.data });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});

module.exports = router;
