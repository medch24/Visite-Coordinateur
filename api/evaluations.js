const mongoose = require('mongoose');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://demo:demo123@cluster0.mongodb.net/teacherEvaluationDB?retryWrites=true&w=majority';

// Fonction de connexion MongoDB avec gestion d'erreurs
let cachedConnection = null;
async function connectToDatabase() {
    if (cachedConnection) {
        return cachedConnection;
    }
    
    try {
        const connection = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10,
        });
        cachedConnection = connection;
        console.log('Connected to MongoDB');
        return connection;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

// Schéma des évaluations
const evaluationSchema = new mongoose.Schema({
    teacherName: String,
    coordinatorName: String,
    date: { type: Date, default: Date.now },
    criteria: mongoose.Schema.Types.Mixed,
    comments: {
        toImprove: String,
        toEliminate: String
    },
    grandTotal: Number
});

const Evaluation = mongoose.models.Evaluation || mongoose.model('Evaluation', evaluationSchema);

export default async function handler(req, res) {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        await connectToDatabase();

        if (req.method === 'POST') {
            // Créer une nouvelle évaluation
            const evaluation = new Evaluation(req.body);
            await evaluation.save();
            res.json({ success: true, evaluation });
        } else if (req.method === 'GET') {
            // Obtenir les évaluations pour un enseignant
            const { teacherName } = req.query;
            if (!teacherName) {
                return res.status(400).json({ success: false, message: 'Teacher name required' });
            }
            const evaluations = await Evaluation.find({ teacherName });
            res.json(evaluations);
        } else {
            res.status(405).json({ success: false, message: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Evaluations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}