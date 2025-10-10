// Base de données temporaire en mémoire pour les évaluations
let EVALUATIONS_DATA = [];

// Fonction pour ajouter une évaluation
function addEvaluation(evaluationData) {
    const evaluation = {
        id: Date.now().toString(),
        ...evaluationData,
        date: new Date()
    };
    EVALUATIONS_DATA.push(evaluation);
    return evaluation;
}

// Fonction pour récupérer les évaluations d'un enseignant
function getEvaluationsByTeacher(teacherName) {
    return EVALUATIONS_DATA.filter(eval => eval.teacherName === teacherName);
}

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
        if (req.method === 'POST') {
            // Créer une nouvelle évaluation
            console.log('Creating new evaluation:', req.body); // Pour debug
            const evaluation = addEvaluation(req.body);
            res.json({ success: true, evaluation });
        } else if (req.method === 'GET') {
            // Obtenir les évaluations pour un enseignant
            const { teacherName } = req.query;
            if (!teacherName) {
                return res.status(400).json({ success: false, message: 'Teacher name required' });
            }
            console.log('Getting evaluations for:', teacherName); // Pour debug
            const evaluations = getEvaluationsByTeacher(teacherName);
            res.json(evaluations);
        } else {
            res.status(405).json({ success: false, message: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Evaluations error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
}