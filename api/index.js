/**
 * Professional Teacher Evaluation System - Serverless API
 * Vercel Serverless Function for handling evaluation data
 * Supports 100-point evaluation system with Word generation capabilities
 */

export default function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, url } = req;

  // API Status endpoint
  if (method === 'GET' && url === '/api/') {
    return res.status(200).json({
      status: 'success',
      message: 'Professional Teacher Evaluation System API',
      version: '2.0.0',
      features: [
        'Client-side evaluation database',
        '100-point academic assessment system',
        'Word document generation',
        'Bilingual support (EN/FR)',
        'School branding system',
        'Performance level calculation',
        'Comprehensive reporting'
      ],
      endpoints: {
        '/api/health': 'API health check',
        '/api/': 'API information'
      }
    });
  }

  // Health check endpoint
  if (method === 'GET' && url === '/api/health') {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: 'Teacher Evaluation System is running properly'
    });
  }

  // Default response for undefined routes
  return res.status(404).json({
    error: 'Endpoint not found',
    message: 'This is a client-side application. All evaluation data is stored locally in the browser.',
    availableEndpoints: ['/api/', '/api/health']
  });
}