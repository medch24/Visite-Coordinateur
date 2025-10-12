/**
 * Professional Teacher Evaluation System - Serverless API
 * Vercel Serverless Function for handling evaluation data
 * Supports 100-point evaluation system with Word generation capabilities
 */

export default function handler(req, res) {
  // Activer CORS pour toutes les origines (important pour les API serverless)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Gérer les requêtes "preflight" OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, url } = req;

  // Endpoint d'information de l'API
  if (method === 'GET' && url === '/api/') {
    return res.status(200).json({
      status: 'success',
      message: 'Professional Teacher Evaluation System API',
      version: '2.0.0',
      features: [
        'Client-side evaluation database (localStorage)',
        '100-point academic assessment system',
        'Word document generation with detailed tables',
        'Bilingual support (EN/FR)',
        'Enhanced teacher and coordinator dashboards'
      ],
      endpoints: {
        '/api/health': 'API health check',
        '/api/': 'API information'
      }
    });
  }

  // Endpoint de vérification de santé
  if (method === 'GET' && url === '/api/health') {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: 'Teacher Evaluation System is running properly'
    });
  }

  // Réponse par défaut pour les routes non définies
  return res.status(404).json({
    error: 'Endpoint not found',
    message: 'This is a client-side application. All evaluation data is stored locally in the browser.',
    availableEndpoints: ['/api/', '/api/health']
  });
}
