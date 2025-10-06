const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Pour servir les fichiers HTML, CSS

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/teacherEvaluationDB', { useNewUrlParser: true, useUnifiedTopology: true });

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

// Initialisation des utilisateurs (à exécuter une seule fois)
async function seedDatabase() {
    await User.deleteMany({});
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
seedDatabase();


// --- API Routes ---

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) {
        res.json({ success: true, user: { username: user.username, role: user.role, assignedTeachers: user.assignedTeachers } });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Soumettre une évaluation
app.post('/api/evaluations', async (req, res) => {
    const evaluation = new Evaluation(req.body);
    await evaluation.save();
    res.json({ success: true, evaluation });
});

// Obtenir les évaluations pour un enseignant
app.get('/api/evaluations/:teacherName', async (req, res) => {
    const evaluations = await Evaluation.find({ teacherName: req.params.teacherName });
    res.json(evaluations);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});