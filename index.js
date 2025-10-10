const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration MongoDB pour production avec fallback
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
            serverSelectionTimeoutMS: 5000, // Timeout après 5 secondes
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

// Schémas de la base de données
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['coordinator', 'teacher'], required: true },
    assignedTeachers: [String] // Pour les coordinateurs
});

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

const User = mongoose.model('User', userSchema);
const Evaluation = mongoose.model('Evaluation', evaluationSchema);

// Initialisation des utilisateurs (seulement si la base est vide)
async function seedDatabase() {
    try {
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            const users = [
                // Coordinateurs
                { username: 'Mohamed', password: 'Mohamed@86', role: 'coordinator', assignedTeachers: ['Morched', 'Kamel', 'Abas', 'Zine', 'Youssef', 'Oumarou', 'Tonga', 'Sylvano', 'Sami', 'Mohamed Ali'] },
                { username: 'Zohra', password: 'Zohra@40', role: 'coordinator', assignedTeachers: ['Aichetou', 'Inas', 'Anwar', 'Souha', 'Amal', 'Shanouja', 'Jana', 'Hiba'] },
                { username: 'Rasha', password: 'Rasha@26', role: 'coordinator', assignedTeachers: ['Amal', 'Rouba', 'Rayan', 'Imane', 'Nesrine', 'Fatima', 'Samar', 'Romana', 'Nour'] },
                // Enseignants
                ...['Morched', 'Kamel', 'Abas', 'Zine', 'Youssef', 'Oumarou', 'Tonga', 'Sylvano', 'Sami', 'Mohamed Ali', 'Aichetou', 'Inas', 'Anwar', 'Souha', 'Amal', 'Shanouja', 'Jana', 'Hiba', 'Rouba', 'Rayan', 'Imane', 'Nesrine', 'Fatima', 'Samar', 'Romana', 'Nour'].map(name => ({ username: name, password: name, role: 'teacher' }))
            ];
            await User.insertMany(users);
            console.log('Database seeded!');
        }
    } catch (error) {
        console.log('Seeding skipped or failed:', error.message);
    }
}


// --- API Routes ---

// Login
app.post('/api/login', async (req, res) => {
    try {
        await connectToDatabase();
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (user) {
            res.json({ success: true, user: { username: user.username, role: user.role, assignedTeachers: user.assignedTeachers } });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Soumettre une évaluation
app.post('/api/evaluations', async (req, res) => {
    try {
        await connectToDatabase();
        const evaluation = new Evaluation(req.body);
        await evaluation.save();
        res.json({ success: true, evaluation });
    } catch (error) {
        console.error('Evaluation save error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Obtenir les évaluations pour un enseignant
app.get('/api/evaluations/:teacherName', async (req, res) => {
    try {
        await connectToDatabase();
        const evaluations = await Evaluation.find({ teacherName: req.params.teacherName });
        res.json(evaluations);
    } catch (error) {
        console.error('Get evaluations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Route pour servir l'application principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialiser la base de données au démarrage
connectToDatabase().then(() => {
    seedDatabase();
}).catch(console.error);

// Export pour Vercel (serverless)
if (process.env.VERCEL) {
    module.exports = app;
} else {
    // Mode développement local
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}