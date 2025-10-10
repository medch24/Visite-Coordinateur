const mongoose = require('mongoose');

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

// Schémas de la base de données
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['coordinator', 'teacher'], required: true },
    assignedTeachers: [String]
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

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

export default async function handler(req, res) {
    // Définir les headers CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        await connectToDatabase();
        await seedDatabase();
        
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
}