/**
 * Professional Teacher Evaluation System - Serverless API with MongoDB
 * Vercel Serverless Function for handling evaluation data
 * Supports 100-point evaluation system with automatic MongoDB storage
 * Version 4.0 - Optimized for direct MongoDB connection and fast loading
 */

import { MongoClient } from 'mongodb';

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/teacher-evaluation?retryWrites=true&w=majority';
const DB_NAME = 'teacher_evaluation_system';

// Cache pour la connexion MongoDB (optimisé pour les fonctions serverless)
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  
  await client.connect();
  const db = client.db(DB_NAME);

  // Créer des index pour améliorer les performances
  const evaluationsCollection = db.collection('evaluations');
  await evaluationsCollection.createIndex({ teacherName: 1, date: -1 });
  await evaluationsCollection.createIndex({ id: 1 }, { unique: true });

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
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

  const { method } = req;
  const url = req.url || '';

  try {
    // Endpoint d'information de l'API
    if (method === 'GET' && url === '/api/') {
      return res.status(200).json({
        status: 'success',
        message: 'Professional Teacher Evaluation System API with MongoDB',
        version: '3.0.0',
        features: [
          'Automatic MongoDB storage',
          '100-point academic assessment system',
          'Word document generation with detailed tables',
          'Bilingual support (EN/FR)',
          'Enhanced teacher and coordinator dashboards',
          'Real-time data synchronization'
        ],
        endpoints: {
          '/api/health': 'API health check',
          '/api/evaluations': 'GET/POST evaluations',
          '/api/evaluations/:id': 'GET/PUT/DELETE specific evaluation',
          '/api/users': 'GET user data',
          '/api/': 'API information'
        }
      });
    }

    // Endpoint de vérification de santé
    if (method === 'GET' && url === '/api/health') {
      const { db } = await connectToDatabase();
      await db.admin().ping();
      
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: 'Teacher Evaluation System is running properly',
        database: 'MongoDB connected and operational'
      });
    }

    // Endpoints pour les évaluations
    if (url.startsWith('/api/evaluations')) {
      const { db } = await connectToDatabase();
      const evaluationsCollection = db.collection('evaluations');

      // GET toutes les évaluations ou par enseignant (optimisé)
      if (method === 'GET') {
        const { teacherName, coordinatorName } = req.query;
        
        let query = {};
        if (teacherName) query.teacherName = teacherName;
        if (coordinatorName) query.coordinatorName = coordinatorName;
        
        const evaluations = await evaluationsCollection
          .find(query)
          .sort({ date: -1 })
          .limit(100) // Limiter à 100 évaluations les plus récentes
          .toArray();
        
        return res.status(200).json({
          success: true,
          count: evaluations.length,
          data: evaluations,
          timestamp: new Date().toISOString()
        });
      }

      // POST nouvelle évaluation
      if (method === 'POST') {
        const evaluationData = {
          ...req.body,
          id: Date.now().toString(),
          date: new Date().toISOString(),
          createdAt: new Date()
        };

        const result = await evaluationsCollection.insertOne(evaluationData);
        
        return res.status(201).json({
          success: true,
          message: 'Évaluation enregistrée avec succès',
          data: { ...evaluationData, _id: result.insertedId }
        });
      }

      // Gestion d'une évaluation spécifique par ID
      const pathParts = url.split('/');
      if (pathParts.length === 4) {
        const evaluationId = pathParts[3];

        // GET évaluation par ID
        if (method === 'GET') {
          const evaluation = await evaluationsCollection.findOne({ id: evaluationId });
          
          if (!evaluation) {
            return res.status(404).json({
              success: false,
              message: 'Évaluation non trouvée'
            });
          }

          return res.status(200).json({
            success: true,
            data: evaluation
          });
        }

        // PUT mise à jour d'une évaluation
        if (method === 'PUT') {
          const updateData = {
            ...req.body,
            updatedAt: new Date()
          };

          const result = await evaluationsCollection.updateOne(
            { id: evaluationId },
            { $set: updateData }
          );

          if (result.matchedCount === 0) {
            return res.status(404).json({
              success: false,
              message: 'Évaluation non trouvée'
            });
          }

          return res.status(200).json({
            success: true,
            message: 'Évaluation mise à jour avec succès'
          });
        }

        // DELETE suppression d'une évaluation
        if (method === 'DELETE') {
          const result = await evaluationsCollection.deleteOne({ id: evaluationId });

          if (result.deletedCount === 0) {
            return res.status(404).json({
              success: false,
              message: 'Évaluation non trouvée'
            });
          }

          return res.status(200).json({
            success: true,
            message: 'Évaluation supprimée avec succès'
          });
        }
      }
    }

    // Endpoint pour les utilisateurs
    if (method === 'GET' && url === '/api/users') {
      // Retourner la liste des utilisateurs (peut être stockée en base plus tard)
      const users = [
        { username: 'Mohamed', role: 'coordinator', assignedTeachers: ['Morched', 'Kamel', 'Abas', 'Zine', 'Youssef', 'Oumarou', 'Tonga', 'Sylvano', 'Sami', 'Mohamed Ali'] },
        { username: 'Zohra', role: 'coordinator', assignedTeachers: ['Aichetou', 'Inas', 'Anwar', 'Souha', 'Amal', 'Shanouja', 'Jana', 'Hiba'] },
        { username: 'Rasha', role: 'coordinator', assignedTeachers: ['Amal', 'Rouba', 'Rayan', 'Imane', 'Nesrine', 'Fatima', 'Samar', 'Romana', 'Nour'] },
        ...['Morched', 'Kamel', 'Abas', 'Zine', 'Youssef', 'Oumarou', 'Tonga', 'Sylvano', 'Sami', 'Mohamed Ali', 'Aichetou', 'Inas', 'Anwar', 'Souha', 'Amal', 'Shanouja', 'Jana', 'Hiba', 'Rouba', 'Rayan', 'Imane', 'Nesrine', 'Fatima', 'Samar', 'Romana', 'Nour'].map(name => ({ username: name, role: 'teacher' }))
      ];

      return res.status(200).json({
        success: true,
        data: users
      });
    }

    // Endpoint pour synchroniser les données localStorage vers MongoDB
    if (method === 'POST' && url === '/api/sync-data') {
      const { db } = await connectToDatabase();
      const evaluationsCollection = db.collection('evaluations');
      const { evaluations } = req.body;

      if (evaluations && Array.isArray(evaluations)) {
        // Synchroniser les évaluations du localStorage vers MongoDB
        const operations = evaluations.map(eval => ({
          updateOne: {
            filter: { id: eval.id },
            update: { 
              $set: { 
                ...eval, 
                syncedAt: new Date() 
              } 
            },
            upsert: true
          }
        }));

        await evaluationsCollection.bulkWrite(operations);

        return res.status(200).json({
          success: true,
          message: `${evaluations.length} évaluations synchronisées avec succès`
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Données de synchronisation invalides'
      });
    }

    // Réponse par défaut pour les routes non définies
    return res.status(404).json({
      error: 'Endpoint not found',
      message: 'Professional Teacher Evaluation System API with MongoDB',
      availableEndpoints: [
        '/api/',
        '/api/health',
        '/api/evaluations',
        '/api/evaluations/:id',
        '/api/users',
        '/api/sync-data'
      ]
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
