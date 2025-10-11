// Base de données temporaire en mémoire pour les évaluations (partagée)
// NOTE: Dans une vraie application, ceci serait partagé entre les modules
let EVALUATIONS_DATA = [];

module.exports = async function handler(req, res) {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { teacherName } = req.query;
        if (!teacherName) {
            return res.status(400).json({ success: false, message: 'Teacher name required' });
        }
        
        console.log('Getting evaluations for teacher:', teacherName); // Pour debug
        
        // Filtrer les évaluations pour cet enseignant
        const evaluations = EVALUATIONS_DATA.filter(eval => eval.teacherName === teacherName);
        
        console.log(`Found ${evaluations.length} evaluations for ${teacherName}`); // Pour debug
        res.json(evaluations);
    } catch (error) {
        console.error('Get evaluations error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
}