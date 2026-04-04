const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Serve static files but don't fallback to 404 for missing files
app.use(express.static(path.join(__dirname, 'dist'), { fallthrough: true }));

// SPA fallback — serve index.html for all non-file routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Scout v6 running on port ${PORT}`));
