// Fallback server for Vercel - should not be used in production
// This is just to ensure Vercel detects a Node.js application

const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  // Serve index.html for all non-API routes
  if (req.url && !req.url.startsWith('/api/')) {
    const indexPath = path.join(__dirname, 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    res.setHeader('Content-Type', 'text/html');
    res.end(indexContent);
    return;
  }
  
  // This should never be reached as API routes are handled separately
  res.status(404).end('Not Found');
};