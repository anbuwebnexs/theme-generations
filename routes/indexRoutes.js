const express = require('express');
const router = express.Router();

// GET: Home page with chat interface
router.get('/', (req, res) => {
  res.render('index', { title: 'Theme Generator' });
});

// GET: Display generated theme
router.get('/theme', (req, res) => {
  res.render('theme', { title: 'Your Generated Theme' });
});

module.exports = router;
