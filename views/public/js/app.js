// Client-side app functions for theme generator

window.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && document.getElementById('userMessage') === document.activeElement) {
    sendMessage();
  }
});

// Add more client-side logic as needed for real-time updates and page interactions
